'use strict';

var PlaylistEditor = function() {

};

PlaylistEditor.prototype.init = function(tracks) {

    var that = this,
        i,
        len,
        div = document.createElement("div"),
        trackEditor,
        trackElem,
        timeScale;

    div.className = div.className + " playlist-tracks";

    this.config = new Config();
    this.playlistContainer = this.config.getContainer();
    this.trackEditors = [];

    timeScale = new TimeScale();
    timeScale.init();

    this.playlistContainer.appendChild(div);

    this.timeScale = timeScale;

    for (i = 0, len = tracks.length; i < len; i++) {

        trackEditor = new TrackEditor();
        trackElem = trackEditor.init();

        this.trackEditors.push(trackEditor);

        div.appendChild(trackElem);
        trackEditor.loadTrack(tracks[i].url);
    }

    this.cursorPos = 0; //in pixels
    this.sampleRate = this.config.getSampleRate();
    this.resolution = this.config.getResolution();

    //for setInterval that's toggled during play/stop.
    this.interval;
};

PlaylistEditor.prototype.play = function() {
    
    var that = this,
        editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime();

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].schedulePlay(currentTime + 0.2, this.cursorPos);
    }

    this.lastPlay = currentTime + 0.2;

    this.interval = setInterval(that.updateEditor.bind(that), 300);
};

PlaylistEditor.prototype.stop = function() {

     var editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime();

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].scheduleStop(currentTime);
    }

    clearInterval(this.interval);
};

PlaylistEditor.prototype.updateEditor = function() {
    var editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime(),
        elapsed = currentTime - this.lastPlay,
        delta = elapsed * this.sampleRate / this.resolution,
        cursor = this.cursorPos;

    if (elapsed) {
        cursor = ~~(cursor + delta);

        for(i = 0, len = editors.length; i < len; i++) {
            editors[i].updateEditor(cursor);
        }
    } 
};

