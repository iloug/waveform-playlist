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

TrackEditor.prototype.init = function(leftOffset) {
    var that = this;

    this.config = new Config();

    this.container = document.createElement("div");

    this.drawer = new WaveformDrawer();
    this.drawer.init(this.container);

    this.playout = new AudioPlayout();
    this.playout.init();

    this.sampleRate = this.config.getSampleRate();
    this.resolution = this.config.getResolution();

    this.leftOffset = leftOffset || 0; //value is measured in samples.

    //value is a float in seconds
    this.startTime = this.leftOffset / this.sampleRate;
    //value is a float in seconds
    this.endTime = 0;

    this.prevStateEvents = {};

    this.setState(this.config.getState());

    //keep track of all fades which have been applied to this track.
    this.fades = {};

    this.selectedArea = {
        start: undefined,
        end: undefined
    };

    return this.container;
};

/**
 * Loads an audio file via XHR.
 */
TrackEditor.prototype.loadTrack = function(src) {
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
        that.playout.loadData(
            e.target.response,
            that.onTrackLoad.bind(that)
        );
    }, false);

    xhr.open('GET', src, true);
    xhr.send();
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
    TODO check to see if this can be done on the containing div, not canvas element
    so that the mouse drag can be over any channel in the track.
*/
TrackEditor.prototype.selectStart = function(e) {
    var el = e.target,
        startX = e.pageX,
        prevX = e.pageX,
        editor = this,
        pixelOffset = this.leftOffset / this.resolution;

    this.selectedArea = {
        start: undefined,
        end: undefined
    };

    ToolBar.prototype.on("applyfade", "onApplyFade", editor);

    editor.updateEditor(0);
    editor.drawer.drawHighlight(startX, startX, true, pixelOffset);

    //dynamically put an event on the element.
    el.onmousemove = function(e) {
        var currentX = e.pageX,
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
        editor.drawer.drawHighlight(startX, startX, true, pixelOffset);

        /*
        console.log('----------------------');
        console.log(min);
        console.log(max);
        console.log(startX);
        console.log(prevX);
        console.log(currentX); 
        console.log('----------------------');
        */

        prevX = currentX;
    };
    document.body.onmouseup = function(e) {
        var endX = e.pageX;

        this.selectedArea = {
            start: startX,
            end: endX
        };

        el.onmousemove = document.body.onmouseup = null;
        editor.drawer.drawHighlight(endX, endX, true, pixelOffset);    
    };
};

/* end of state methods */

TrackEditor.prototype.onTrackLoad = function(buffer) {
    var that = this;

    this.endTime = buffer.length/this.sampleRate;

    this.drawer.drawBuffer(buffer, this.leftOffset);

    this.numSamples = buffer.length;
    this.duration = buffer.duration;
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

//cursorPos (in pixels)
TrackEditor.prototype.schedulePlay = function(when, cursorPos, duration) { 
    var start,
        end,
        cursorTime = cursorPos * this.resolution / this.sampleRate;

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

    end = this.duration - start;
    this.playout.play(when, start, end);
};

TrackEditor.prototype.scheduleStop = function(when) {
   
    this.playout.stop(when); 
};

TrackEditor.prototype.updateEditor = function(cursorPos) {
    var pixelOffset = this.leftOffset / this.resolution;

    this.drawer.updateEditor(cursorPos, pixelOffset);
};

makePublisher(TrackEditor.prototype);

