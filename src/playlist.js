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

    this.ac = params.playout.ac;

    this.trackEditors = [];

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function(key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    for (i = 0, len = tracks.length; i < len; i++) {

        trackEditor = new TrackEditor();
        trackElem = trackEditor.init(params);

        this.trackEditors.push(trackEditor);

        fragment.appendChild(trackElem);
        trackEditor.loadTrack(tracks[i].url);
    }

    this.container.appendChild(fragment);

    this.cursorPos = 0; //in pixels
    this.sampleRate = this.ac.sampleRate;
}

PlaylistEditor.prototype.play = function() {
    
    var editors = this.trackEditors,
        i,
        len,
        currentTime = this.ac.currentTime;

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].schedulePlay(currentTime + 0.2, this.cursorPos);
    }

}

PlaylistEditor.prototype.stop = function() {

     var editors = this.trackEditors,
        i,
        len,
        currentTime = this.ac.currentTime;

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].scheduleStop(currentTime + 0.2);
    }
}

