var TrackEditor = function() {

    this.defaultParams = {
        
    };
}

TrackEditor.prototype.init = function(params) {

    var that = this;

    this.container = document.createElement("div");

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function (key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    this.drawer = new WaveformDrawer();
    params.drawer.container = this.container;
    this.drawer.init(params.drawer || {});

    this.playout = new AudioPlayout();
    this.playout.init(params.playout || {});

    this.playout.onAudioUpdate(that.onAudioUpdate.bind(that));

    this.sampleRate = this.playout.ac.sampleRate;
    this.resolution = params.drawer.resolution;

    this.marker = 0;
    this.leftOffset = params.leftOffset || 0; //value is measured in samples.

    //value is a float in seconds
    this.startTime = this.leftOffset/this.sampleRate;
    //value is a float in seconds
    this.endTime = 0;

    //this.container.setAttribute('id', 'track-editor');
    this.container.style.height = this.drawer.params.waveHeight+"px";

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
        res = editor.drawer.params.resolution;

    //origX = parseInt(e.target.style.left, 10);
    //if (isNaN(origX)) origX = 0;

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

    this.endTime = this.playout.buffer.length/this.sampleRate;

    this.drawer.drawBuffer(buffer, this.leftOffset);

    this.numSamples = buffer.length;
    this.duration = buffer.duration;

    //this.bindClick(this.container, function (x, width) {
    //    that.playAt(x, width);
    //});
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

TrackEditor.prototype.playAt = function(x, width) {
   
    this.marker = x;
    this.playout.setPlayOffset(x/width);
    this.playout.play();
};

TrackEditor.prototype.onAudioUpdate = function(e) {
    
    //this.drawer.updateEditor(this.marker, this.playout.getPlayedPercents());
};

 /**
 * Click to seek.
 */
TrackEditor.prototype.bindClick = function(element, callback) {
    var that = this;

    element.addEventListener('click', function(e) {
        var relX = e.offsetX;
        if (null == relX) { relX = e.layerX; }
        callback(relX, that.drawer.width);
    }, false);
};

