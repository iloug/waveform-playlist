'use strict';

var TrackEditor = function() {

}

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
    this.startTime = this.leftOffset/this.sampleRate;
    //value is a float in seconds
    this.endTime = 0;

    //TODO this needs to be changed to different callback states
    this.container.onmousedown = this.timeShift.bind(that);

    return this.container;
}

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

//TODO move this to a better location, just for trying out.
//will move the waveform only changing the x-axis.
//a mousedown event.
TrackEditor.prototype.timeShift = function(e) {
    var startX = e.pageX, 
        diffX = 0, 
        origX = 0,
        updatedX = 0,
        editor = this,
        res = editor.resolution;

    origX = editor.leftOffset/res;
    
    //dynamically put an event on the element.
    e.target.onmousemove = function(e) {
        var endX = e.pageX;
        
        diffX = endX - startX;
        updatedX = origX + diffX;
        editor.drawer.setTimeShift(updatedX);
    };
    document.body.onmouseup = function() {
        var delta;

        e.target.onmousemove = document.body.onmouseup = null;
        editor.leftOffset = updatedX * res;

        delta = diffX * res / editor.sampleRate;

        //update track's start and end time relative to the playlist.
        editor.startTime = editor.startTime + delta;
        editor.endTime = editor.endTime + delta;
    };
};

TrackEditor.prototype.onTrackLoad = function(buffer) {
    var that = this;

    this.endTime = buffer.length/this.sampleRate;

    this.drawer.drawBuffer(buffer, this.leftOffset);

    this.numSamples = buffer.length;
    this.duration = buffer.duration;
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

