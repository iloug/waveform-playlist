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
        timeScale,
        toolBar;

    div.className = div.className + " playlist-tracks";

    this.config = new Config();
    this.storage = new Storage();


    this.trackContainer = div;
    this.playlistContainer = this.config.getContainer();
    this.trackEditors = [];

    toolBar = new ToolBar();
    toolBar.init();

    timeScale = new TimeScale();
    timeScale.init();

    this.playlistContainer.appendChild(div);

    this.timeScale = timeScale;
    
    for (i = 0, len = tracks.length; i < len; i++) {

        trackEditor = new TrackEditor();
        trackElem = trackEditor.loadTrack(tracks[i]);
    
        this.trackEditors.push(trackEditor);
        div.appendChild(trackElem);

        ToolBar.prototype.on("changestate", "onStateChange", trackEditor);
    }

    div.onscroll = this.onTrackScroll.bind(that);

    this.sampleRate = this.config.getSampleRate();
    this.resolution = this.config.getResolution();

    this.scrollTimeout = false;

    //for setInterval that's toggled during play/stop.
    this.interval;

    PlaylistEditor.prototype.on("trackscroll", "onTrackScroll", timeScale);

    ToolBar.prototype.on("playlistsave", "save", this);
    ToolBar.prototype.on("playlistrestore", "restore", this);
    ToolBar.prototype.on("rewindaudio", "rewind", this);
    ToolBar.prototype.on("playaudio", "play", this);
    ToolBar.prototype.on("stopaudio", "stop", this);
};

PlaylistEditor.prototype.onTrackScroll = function(e) {
    var that = this,
        el = e.srcElement;

    if (that.scrollTimeout) return;

    //limit the scroll firing to every 25ms.
    that.scrollTimeout = setTimeout(function() {
        
        that.config.setTrackScroll(el.scrollLeft, el.scrollTop);
        that.fire('trackscroll', e);
        that.scrollTimeout = false;
    }, 25);   
};

PlaylistEditor.prototype.rewind = function() {
  
    this.stop();
    this.config.setCursorPos(0);
};

PlaylistEditor.prototype.isPlaying = function() {
     var that = this,
        editors = this.trackEditors,
        i,
        len,
        isPlaying = false;

    for(i = 0, len = editors.length; i < len; i++) {
        isPlaying = isPlaying || editors[i].isPlaying();
    }

    return isPlaying;
};

PlaylistEditor.prototype.play = function() {
    var that = this,
        editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime(),
        delay = 0.2,
        cursorPos = this.config.getCursorPos();

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].schedulePlay(currentTime, delay, cursorPos);
    }

    this.lastPlay = currentTime + delay;

    this.interval = setInterval(that.updateEditor.bind(that), 200);
};

PlaylistEditor.prototype.stop = function() {
     var editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime();

    for (i = 0, len = editors.length; i < len; i++) {
        editors[i].scheduleStop(currentTime);
        editors[i].updateEditor(0);
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
        cursorPos = this.config.getCursorPos();

    if (this.isPlaying()) {

        if (elapsed) {
            cursorPos = ~~(cursorPos + delta);

            for(i = 0, len = editors.length; i < len; i++) {
                editors[i].updateEditor(cursorPos);
            }
        }
    }
    else {
        clearInterval(this.interval);
    } 
};

PlaylistEditor.prototype.save = function() {
     var editors = this.trackEditors,
        i,
        len,
        info = [];

    for (i = 0, len = editors.length; i < len; i++) {
        info.push(editors[i].getTrackDetails());
    }

    this.storage.save("test", info);
};

PlaylistEditor.prototype.restore = function() {
    var state;

    state = this.storage.restore("test");

    this.trackContainer.innerHTML='';
    this.init(state);
};

makePublisher(PlaylistEditor.prototype);

