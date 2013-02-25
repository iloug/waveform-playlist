var AudioPlayout = function() {

    this.defaultParams = {
        
    };
}

AudioPlayout.prototype.init = function(params) {

    var that = this;

    this.ac = params.ac;
    
    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function(key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    this.destination = this.ac.destination;

    this.analyser = this.ac.createAnalyser();
    this.analyser.connect(this.destination);

    this.proc = this.ac.createScriptProcessor(2048, 1, 1);
    
    this.playing = false;
    this.secondsOffset = 0;
}

/**
 * Loads audiobuffer.
 *
 * @param {AudioBuffer} audioData Audio data.
 */
AudioPlayout.prototype.loadData = function (audioData, cb) {
    var that = this;

    this.ac.decodeAudioData(
        audioData,
        function (buffer) {
            that.buffer = buffer;
            cb(buffer);
        },
        Error
    );
};

AudioPlayout.prototype.onAudioUpdate = function(callback) {
    this.proc.onaudioprocess = callback;
};

AudioPlayout.prototype.isPlaying = function() {
    return this.playing;
};

AudioPlayout.prototype.getDuration = function() {
    return this.buffer.duration;
};

AudioPlayout.prototype.setPlayOffset = function(percent) {
    this.secondsOffset = percent * this.getDuration();
}

AudioPlayout.prototype.getPlayOffset = function() {
    var offset = 0;

    //TODO needs a fix for when the buffer naturally plays out. But also have to mind the entire playlist.
    if (this.playing) {
        offset = this.secondsOffset + (this.ac.currentTime - this.playTime);
    }
    else {
        offset = this.secondsOffset;
    }

    return offset;
};

AudioPlayout.prototype.setPlayedPercents = function(percent) {
    this.secondsOffset = this.getDuration() * percent;
};

AudioPlayout.prototype.getPlayedPercents = function() {
    return this.getPlayOffset() / this.getDuration();
};

AudioPlayout.prototype.setSource = function(source) {
    this.source && this.source.disconnect();
    this.source = source;
    this.source.connect(this.analyser);
};

/*
    source.start is picky when passing the end time. 
    If rounding error causes a number to make the source think 
    it is playing slightly more samples than it has it won't play at all.
    Unfortunately it doesn't seem to work if you just give it a start time.
*/
AudioPlayout.prototype.play = function(delay, start, end) {
    if (!this.buffer) {
        console.error("no buffer to play");
        return;
    }

    this.setSource(this.ac.createBufferSource());
    this.source.buffer = this.buffer;

    this.proc.connect(this.analyser);

    this.source.start(delay || 0, start, end);
};

AudioPlayout.prototype.stop = function(delay) {
 
    this.source.stop(delay || 0);
    this.proc.disconnect(this.analyser);
}

