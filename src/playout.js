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
    //this.proc.connect(this.destination);
}


AudioPlayout.prototype.isPaused = function() {
    return this.paused;
};

AudioPlayout.prototype.getDuration = function() {
    return this.buffer.duration;
};

AudioPlayout.prototype.getCurrentTime = function() {
    
};

AudioPlayout.prototype.getPlayedPercents = function() {
    return this.getCurrentTime() / this.getDuration();
};

AudioPlayout.prototype.setSource = function(source) {
    this.source && this.source.disconnect();
    this.source = source;
    this.source.connect(this.analyser);
};


AudioPlayout.prototype.play = function() {
    if (!this.buffer) {
        console.error("no buffer to play");
        return;
    }

    this.setSource(this.ac.createBufferSource());
    this.source.buffer = this.buffer;

    this.proc.connect(this.analyser);
    this.source.start(0);
};

/*
    Will pause audio playback. Different from stop() as it leaves the cursor's pause position on the UI.
*/
AudioPlayout.prototype.pause = function(delay) {
    //this.lastPause = this.getCurrentTime();

    this.source.stop(delay || 0);
    this.paused = true;

    this.proc.disconnect(this.analyser);
};

AudioPlayout.prototype.stop = function(delay) {
    this.source.stop(delay || 0);

    this.proc.disconnect(this.analyser);
}

