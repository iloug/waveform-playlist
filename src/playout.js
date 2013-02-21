var AudioPlayout = function() {

    this.defaultParams = {
        
    };
}

AudioPlayout.prototype.init = function(params) {

    var that = this;

    this.buffer = params.buffer;
    this.ac = params.context;
    delete params.buffer;
    delete params.context;
    
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
    //place on UI where user has clicked to start from.
    this.markerPos = 0;
    //cursor marks where the audio was last paused.
    this.cursorPos = 0;
}

AudioPlayout.prototype.onAudioUpdate = function(callback) {
    this.proc.onaudioprocess = callback;
};


AudioPlayout.prototype.isPlaying = function() {
    return this.playing;
};

AudioPlayout.prototype.getDuration = function() {
    return this.buffer.duration;
};

AudioPlayout.prototype.getPlayOffset = function() {
    var offset = 0;

    if (this.playing) {
        offset = this.secondsOffset + (this.ac.currentTime - this.playTime);
    }
    else {
        offset = this.secondsOffset;
    }

    return offset;
};

AudioPlayout.prototype.getPlayedPercents = function() {
    return this.getPlayOffset() / this.getDuration();
};

AudioPlayout.prototype.setSource = function(source) {
    this.source && this.source.disconnect();
    this.source = source;
    this.source.connect(this.analyser);
};


AudioPlayout.prototype.play = function(delay) {
    var buffer = this.buffer;

    if (!buffer) {
        console.error("no buffer to play");
        return;
    }

    if (this.playing) {
        return;
    }

    this.secondsOffset = 0;
    this.setSource(this.ac.createBufferSource());
    this.source.buffer = buffer;

    this.proc.connect(this.analyser);

    this.playTime = this.ac.currentTime;
    this.playing = true;
    this.source.start(delay || 0, this.cursorPos, this.getDuration() - this.cursorPos);
};

AudioPlayout.prototype.resume = function(delay) {
    if (!this.buffer) {
        console.error("no buffer to play");
        return;
    }

    if (this.playing) {
        return;
    }

    this.setSource(this.ac.createBufferSource());
    this.source.buffer = this.buffer;

    this.proc.connect(this.analyser);

    this.playTime = this.ac.currentTime;
    this.playing = true;
    this.source.start(delay || 0, this.getPlayOffset(), this.getDuration() - this.getPlayOffset());
};

/*
    Will pause audio playback. Different from stop() as it leaves the cursor's pause position on the UI.
*/
AudioPlayout.prototype.pause = function(delay) {
    var elapsed;

    if (!this.playing) {
        return;
    }

    this.source.stop(delay || 0);
    this.pauseTime = this.ac.currentTime;

    this.playing = false;
    elapsed = this.pauseTime - this.playTime;

    this.secondsOffset += elapsed;
    this.proc.disconnect(this.analyser);
};

AudioPlayout.prototype.stop = function(delay) {

    if (!this.playing) {
        return;
    }

    this.secondsOffset = this.cursorPos;
    this.source.stop(delay || 0);
    this.stopTime = this.ac.currentTime;

    this.playing = false;
    this.proc.disconnect(this.analyser);
}

