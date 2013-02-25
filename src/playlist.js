var PlaylistEditor = function() {

    this.defaultParams = {
        
    };
}

PlaylistEditor.prototype.init = function(params, tracks) {

    var that = this,
        i,
        len,
        fragment = document.createDocumentFragment(),
        trackEditor,
        trackElem;

    this.container = params.container;
    delete params.container;

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function(key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    for (i = 0, len = tracks.length; i < len; i++ ) {

        trackEditor = new TrackEditor();
        trackElem = trackEditor.init(params);

        fragment.appendChild(trackElem);
        trackEditor.loadTrack(tracks[i].url);
    }

    this.container.appendChild(fragment);
}

