var TrackEditor = function() {

}

TrackEditor.prototype.init = function(params) {

    var that = this;

    this.buffer = params.buffer;
    this.container = params.container;
    delete params.buffer;
    delete params.container;

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function (key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    this.params.sampleLength = this.buffer.getChannelData(0).length;
    this.params.numChan = this.buffer.numberOfChannels;
}
