'use strict';

var TrackEditor = function() {

};

TrackEditor.prototype.states = {
    select: {
        mousedown: "selectStart"
    },
    
    shift: {
        mousedown: "timeShift"
    }
};

TrackEditor.prototype.init = function(src, start, end, fades) {
    var that = this;

    this.config = new Config();
    this.container = document.createElement("div");

    this.drawer = new WaveformDrawer();
    this.drawer.init(this.container);

    this.playout = new AudioPlayout();
    this.playout.init();

    this.sampleRate = this.config.getSampleRate();
    this.resolution = this.config.getResolution();

    //value is a float in seconds
    this.startTime = start || 0;
    //value is a float in seconds
    this.endTime = end || 0; //set properly in onTrackLoad.

    this.leftOffset = this.startTime * this.sampleRate; //value is measured in samples.

    this.prevStateEvents = {};
    this.setState(this.config.getState());

    this.fades = fades || {};

    this.selectedArea = {
        start: undefined,
        end: undefined
    };

    this.container.classList.add("channel-wrapper");
    this.container.style.left = this.leftOffset;

    return this.container;
};

TrackEditor.prototype.getFadeId = function() {
    var id = ""+Math.random();

    return id.replace(".", "");
};

TrackEditor.prototype.getBuffer = function() {
    return this.playout.buffer;
};

TrackEditor.prototype.loadTrack = function(track) {
    var el;

    el = this.init(track.src, track.start, track.end, track.fades);
    this.loadBuffer(track.src);

    return el;
};

/**
 * Loads an audio file via XHR.
 */
TrackEditor.prototype.loadBuffer = function(src) {
    var that = this,
        xhr = new XMLHttpRequest();

    xhr.responseType = 'arraybuffer';

    xhr.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            var percentComplete = e.loaded / e.total;
        } 
        else {
            // TODO
            percentComplete = 0;
        }
        //my.drawer.drawLoading(percentComplete);
    }, false);

    xhr.addEventListener('load', function(e) {
        that.src = src;

        that.playout.loadData(
            e.target.response,
            that.onTrackLoad.bind(that)
        );
    }, false);

    xhr.open('GET', src, true);
    xhr.send();
};

TrackEditor.prototype.drawTrack = function(buffer) {

    this.drawer.drawBuffer(buffer, this.leftOffset);
    this.drawer.drawFades(this.fades);
};

TrackEditor.prototype.onTrackLoad = function(buffer) {
   
    this.endTime = (buffer.length / this.sampleRate) + this.startTime;
    this.duration = buffer.duration;

    this.drawTrack(buffer);
};

TrackEditor.prototype.getPixelOffset = function() {
    return this.leftOffset / this.resolution;
};

TrackEditor.prototype.activate = function() {
    
};

TrackEditor.prototype.deactivate = function() {
    this.drawer.draw(-1, this.getPixelOffset());
};

/* start of state methods */

//TODO modify this to work with scrolls.
TrackEditor.prototype.timeShift = function(e) {
    var el = e.target,
        startX = e.pageX, 
        diffX = 0, 
        origX = 0,
        updatedX = 0,
        editor = this,
        res = editor.resolution,
        scroll = this.config.getTrackScroll(),
        scrollX = scroll.left;

    origX = editor.leftOffset/res;
    
    //dynamically put an event on the element.
    el.onmousemove = function(e) {
        var endX = e.pageX;
        
        diffX = endX - startX;
        updatedX = origX + diffX;
        editor.drawer.setTimeShift(updatedX);
        editor.leftOffset = updatedX * res;
    };
    document.body.onmouseup = function() {
        var delta;

        el.onmousemove = document.body.onmouseup = null;
        editor.leftOffset = updatedX * res;

        delta = diffX * res / editor.sampleRate;

        //update track's start and end time relative to the playlist.
        editor.startTime = editor.startTime + delta;
        editor.endTime = editor.endTime + delta;
    };
};

/*
    start, end in pixels
*/
TrackEditor.prototype.notifySelectUpdate = function(start, end) {
    var startSec = start * this.resolution / this.sampleRate,
        endSec = end * this.resolution / this.sampleRate;

    this.fire('changecursor', {
        start: startSec,
        end: endSec,
        editor: this
    });
}; 

/* 
    TODO check to see if this can be done on the containing div, not canvas element
    so that the mouse drag can be over any channel in the track.
*/
TrackEditor.prototype.selectStart = function(e) {
    var el = e.target,
        editor = this,
        pixelOffset = this.getPixelOffset(),
        scroll = this.config.getTrackScroll(),
        scrollX = scroll.left,
        startX = scrollX + e.pageX,
        prevX = scrollX + e.pageX;

    this.selectedArea = {
        start: undefined,
        end: undefined
    };

    //remove previously listening track.
    ToolBar.prototype.reset("createfade");

    editor.updateEditor(0);
    editor.drawer.drawHighlight(startX, startX, false, pixelOffset);
    editor.notifySelectUpdate(startX, startX);

    //dynamically put an event on the element.
    el.onmousemove = function(e) {
        var currentX = scrollX + e.pageX,
            delta = currentX - prevX,
            min = Math.min(prevX, currentX, startX),
            max = Math.max(prevX, currentX, startX),
            selectStart,
            selectEnd;
        
        if (currentX > startX) {
            selectStart = startX;
            selectEnd = currentX;
        }
        else {
            selectStart = currentX;
            selectEnd = startX;
        }

        editor.drawer.draw(0, pixelOffset, min, max);
        editor.drawer.drawHighlight(selectStart, selectEnd, false, pixelOffset);
       
        prevX = currentX;
        editor.notifySelectUpdate(min, max);
    };
    document.body.onmouseup = function(e) {
        var endX = scrollX + e.pageX;

        editor.selectedArea = {
            start: Math.min(startX, endX),
            end: Math.max(startX, endX)
        };

        el.onmousemove = document.body.onmouseup = null;
        
        //if more than one pixel is selected, listen to possible fade events.
        if (Math.abs(startX - endX)) {
            ToolBar.prototype.activateFades();
            ToolBar.prototype.on("createfade", "onCreateFade", editor);
            editor.drawer.drawHighlight(endX, endX, false, pixelOffset);
        }
        else {
            ToolBar.prototype.deactivateFades();
            editor.drawer.drawHighlight(endX, endX, true, pixelOffset);
        }

        editor.config.setCursorPos(Math.min(startX, endX));
        editor.notifySelectUpdate(editor.selectedArea.start, editor.selectedArea.end);    
    };
};

/* end of state methods */

TrackEditor.prototype.saveFade = function(id, type, shape, start, end) {
    
    this.fades[id] = {
        type: type,
        shape: shape,
        start: start,
        end: end
    };

    return id;
};

TrackEditor.prototype.removeFade = function(id) {

    delete this.fades[id];
};

TrackEditor.prototype.onCreateFade = function(args) {
    var selected = this.selectedArea,
        pixelOffset = this.getPixelOffset(),
        start = selected.start - pixelOffset,
        end = selected.end - pixelOffset,
        startTime = start * this.resolution / this.sampleRate,
        endTime = end * this.resolution / this.sampleRate,
        id = this.getFadeId();

    ToolBar.prototype.deactivateFades();
    this.config.setCursorPos(0);
    this.saveFade(id, args.type, args.shape, startTime, endTime);
    this.drawer.draw(0, pixelOffset);
    this.drawer.drawFade(id, args.type, args.shape, start, end);  
};

TrackEditor.prototype.setState = function(state) {
    var that = this,
        stateEvents = this.states[state],
        event,
        container = this.container,
        prevState = this.currentState,
        prevStateEvents = this.prevStateEvents,
        func;

    if (prevState) {
       
        for (event in prevStateEvents) {
            container.removeEventListener(event, prevStateEvents[event]);
        }
        this.prevStateEvents = {};
    }

    for (event in stateEvents) {

        func = that[stateEvents[event]].bind(that);
        //need to keep track of the added events for later removal since a new function is returned after using "bind"
        this.prevStateEvents[event] = func;
        container.addEventListener(event, func);
    }

    this.currentState = state;
};

TrackEditor.prototype.onStateChange = function() {
    var state = this.config.getState();

    this.setState(state);
};

TrackEditor.prototype.onResolutionChange = function(res) {
    this.resolution = res;

    this.drawTrack(this.getBuffer());
};

TrackEditor.prototype.isPlaying = function() {
    return this.playout.isScheduled() || this.playout.isPlaying();
};

//cursorPos (in pixels)
TrackEditor.prototype.schedulePlay = function(now, delay, cursorPos, duration) { 
    var start,
        end,
        cursorTime = cursorPos * this.resolution / this.sampleRate,
        relPos,
        when = now + delay;

    //track has no content to play.
    if (this.endTime <= cursorTime) return;

    //track does not start in this selection.
    if (duration && (cursorTime + duration) < this.startTime) return;


    //track should have something to play if it gets here.

    //the track starts in the future of the cursor position
    if (this.startTime >= cursorTime) {
        start = 0;
        when = when + this.startTime - cursorTime; //schedule additional delay for this audio node.
    }
    else {
        start = cursorTime - this.startTime;
    }

    relPos = cursorTime - this.startTime;
    this.playout.applyFades(this.fades, relPos, now, delay);

    end = this.duration - start;
    this.playout.play(when, start, end);
};

TrackEditor.prototype.scheduleStop = function(when) {
   
    this.playout.stop(when); 
};

TrackEditor.prototype.updateEditor = function(cursorPos) {
    var pixelOffset = this.getPixelOffset();

    this.drawer.updateEditor(cursorPos, pixelOffset);
};

TrackEditor.prototype.getTrackDetails = function() {
    var d;

    d = {
        start: this.startTime,
        end: this.endTime,
        fades: this.fades,
        src: this.src
    };

    return d;
};

makePublisher(TrackEditor.prototype);

