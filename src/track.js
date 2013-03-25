'use strict';

var TrackEditor = function(playlistEditor) {
    this.playlistEditor = playlistEditor;
};

TrackEditor.prototype.states = {
    select: {
        events: {
            mousedown: "selectStart"
        },

        classes: [
            "state-select"
        ]
    },
    
    shift: {
        events: {
            mousedown: "timeShift"
        },

        classes: [
            "state-shift"
        ]
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

    this.selectedArea = undefined;
    this.active = false;

    this.container.classList.add("channel-wrapper");
    this.container.style.left = this.leftOffset;

    this.drawer.drawLoading();

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
        var percentComplete;

        if (e.lengthComputable) {
            percentComplete = e.loaded / e.total * 100;
            that.drawer.updateLoader(percentComplete);
        } 

    }, false);

    xhr.addEventListener('load', function(e) {
        that.src = src;
        that.drawer.setLoaderState("decoding");

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

TrackEditor.prototype.pixelsToSeconds = function(pixels) {
    return pixels * this.resolution / this.sampleRate;
};

TrackEditor.prototype.secondsToPixels = function(seconds) {
    return ~~(seconds * this.sampleRate / this.resolution);
};

TrackEditor.prototype.getPixelOffset = function() {
    return this.leftOffset / this.resolution;
};

TrackEditor.prototype.activate = function() {
    this.active = true;
    this.container.classList.add("active");
    this.playlistEditor.setActiveTrack(this);
};

TrackEditor.prototype.deactivate = function() {
    this.active = false;
    this.selectedArea = undefined;
    this.container.classList.remove("active");
    this.drawer.draw(-1, this.getPixelOffset());
};

/* start of state methods */

//TODO modify this to work with scrolls.
TrackEditor.prototype.timeShift = function(e) {
    var el = e.currentTarget, //want the events placed on the channel wrapper.
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
    start, end in pixels
*/
TrackEditor.prototype.setSelectedArea = function(start, end, shiftKey) {
    var left, 
        right,
        currentStart,
        currentEnd;

    //extending selected area since shift is pressed.
    if (shiftKey && (end - start === 0) && (this.selectedArea !== undefined)) {

        currentStart = this.prevSelectedArea.start;
        currentEnd = this.prevSelectedArea.end;

        if (start < currentStart) {
            left = start;
            right = currentEnd;
        }
        else if (end > currentEnd) {
            left = currentStart;
            right = end;
        }
        //it's ambigous otherwise, cut off the smaller duration.
        else {
            if ((start - currentStart) < (currentEnd - start)) {
                left = start;
                right = currentEnd;
            }
            else {
                left = currentStart;
                right = end;
            }
        }
    }
    else {
        left = start;
        right = end;
    }

    this.prevSelectedArea = this.selectedArea;
    
    this.selectedArea = {
        start: left,
        end: right
    };
};

TrackEditor.prototype.selectStart = function(e) {
    var el = e.currentTarget, //want the events placed on the channel wrapper.
        editor = this,
        pixelOffset = this.getPixelOffset(),
        scroll = this.config.getTrackScroll(),
        scrollX = scroll.left,
        startX = scrollX + e.pageX,
        prevX = scrollX + e.pageX;

    //remove previously listening track.
    ToolBar.prototype.reset("createfade");

    editor.setSelectedArea(startX, startX);
    editor.updateEditor(-1, undefined, undefined, true);
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

        editor.setSelectedArea(selectStart, selectEnd);
        editor.updateEditor(-1, min, max, true);
        editor.notifySelectUpdate(min, max);
        prevX = currentX;
    };
    document.body.onmouseup = function(e) {
        var endX = scrollX + e.pageX,
            start, end;

        editor.setSelectedArea(Math.min(startX, endX), Math.max(startX, endX), e.shiftKey);

        start = editor.selectedArea.start;
        end = editor.selectedArea.end;

        el.onmousemove = document.body.onmouseup = null;
        
        //if more than one pixel is selected, listen to possible fade events.
        if (Math.abs(start - end)) {
            ToolBar.prototype.activateFades();
            ToolBar.prototype.on("createfade", "onCreateFade", editor);
        }
        else {
            ToolBar.prototype.deactivateFades();
        }

        editor.updateEditor(-1, start, end, true);
        editor.config.setCursorPos(start);
        editor.notifySelectUpdate(start, end);    
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
        stateEvents = this.states[state].events,
        stateClasses = this.states[state].classes,
        container = this.container,
        prevState = this.currentState,
        prevStateClasses,
        prevStateEvents = this.prevStateEvents,
        func, event, cl,
        i, len;

    if (prevState) {
        prevStateClasses = this.states[prevState].classes;
       
        for (event in prevStateEvents) {
            container.removeEventListener(event, prevStateEvents[event]);
        }
        this.prevStateEvents = {};

        for (i = 0, len = prevStateClasses.length; i < len; i++) {
            container.classList.remove(prevStateClasses[i]);
        }
    }

    for (event in stateEvents) {

        func = that[stateEvents[event]].bind(that);
        //need to keep track of the added events for later removal since a new function is returned after using "bind"
        this.prevStateEvents[event] = func;
        container.addEventListener(event, func);
    }
    for (i = 0, len = stateClasses.length; i < len; i++) {
            container.classList.add(stateClasses[i]);
        }

    this.currentState = state;
};

TrackEditor.prototype.onStateChange = function() {
    var state = this.config.getState();

    this.setState(state);
};

TrackEditor.prototype.onResolutionChange = function(res) {
    var start, end;

    if (this.active === true && this.selectedArea !== undefined) {
        start = this.pixelsToSeconds(this.selectedArea.start);
        end = this.pixelsToSeconds(this.selectedArea.end);
    }

    this.resolution = res;
    this.drawTrack(this.getBuffer());

    if (this.active === true && this.selectedArea !== undefined) {
        this.selectedArea.start = this.secondsToPixels(start);
        this.selectedArea.end = this.secondsToPixels(end);

        this.config.setCursorPos(this.selectedArea.start);
        this.updateEditor(-1, this.selectedArea.start, this.selectedArea.end, true);
    }
};

TrackEditor.prototype.isPlaying = function() {
    return this.playout.isScheduled() || this.playout.isPlaying();
};

//cursorPos (in pixels)
TrackEditor.prototype.schedulePlay = function(now, delay, cursorPos, cursorEnd) { 
    var start,
        duration,
        cursorStartTime = cursorPos * this.resolution / this.sampleRate,
        cursorEndTime = (cursorEnd) ? cursorEnd * this.resolution / this.sampleRate : undefined,
        relPos,
        when = now + delay,
        window = (cursorEnd) ? (cursorEnd - cursorPos) * this.resolution / this.sampleRate : undefined;

    //track has no content to play.
    if (this.endTime <= cursorStartTime) return;

    //track does not start in this selection.
    if (window && (cursorStartTime + window) < this.startTime) return;


    //track should have something to play if it gets here.

    //the track starts in the future of the cursor position
    if (this.startTime >= cursorStartTime) {
        start = 0;
        when = when + this.startTime - cursorStartTime; //schedule additional delay for this audio node.
        window = window - (this.startTime - cursorStartTime);
        duration = (cursorEnd) ? Math.min(window, this.duration) : this.duration;
    }
    else {
        start = cursorStartTime - this.startTime;
        duration = (cursorEnd) ? Math.min(window, this.duration - start) : this.duration - start;
    }

    relPos = cursorStartTime - this.startTime;
    this.playout.applyFades(this.fades, relPos, now, delay);
    this.playout.play(when, start, duration);
};

TrackEditor.prototype.scheduleStop = function(when) {
   
    this.playout.stop(when); 
};

TrackEditor.prototype.updateEditor = function(cursorPos, start, end, highlighted) {
    var pixelOffset = this.getPixelOffset();

    this.drawer.updateEditor(cursorPos, pixelOffset, start, end, highlighted, this.selectedArea);
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

/*
    Will remove all audio samples from the track's buffer except for the currently selected area.
*/
TrackEditor.prototype.trim = function() {
   
};

/*
    Will remove all audio samples from the track's buffer in the currently selected area.
*/
TrackEditor.prototype.removeAudio = function() {
   
};

makePublisher(TrackEditor.prototype);

