var TrackEditor = function() {

    this.defaultParams = {
        
    };
}

TrackEditor.prototype.init = function(params) {

    var that = this;

    this.container = params.container;
    delete params.container;

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function (key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    this.drawer = new WaveformDrawer();
    this.drawer.init(params.drawer || {});

    this.playout = new AudioPlayout();
    this.playout.init(params.playout || {});

    this.playout.onAudioUpdate(that.onAudioUpdate.bind(that));

    this.marker = 0;

    //TODO remove this, only for quick testing.
    window.playout = this.playout;  
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
            that.render.bind(that)
        );
    }, false);

    xhr.open('GET', src, true);
    xhr.send();
};

TrackEditor.prototype.render = function(buffer) {
    var that = this;

    this.drawer.drawBuffer(buffer);

    this.bindClick(this.container, function (x, width) {
        that.playAt(x, width);
    });
};

TrackEditor.prototype.playAt = function(x, width) {
   
    this.marker = x;
    this.playout.setPlayOffset(x/width);
    this.playout.play();
};

TrackEditor.prototype.onAudioUpdate = function(e) {
    
    this.drawer.updateEditor(this.marker, this.playout.getPlayedPercents());
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

