'use strict';

var PlaylistEditor = function() {

};

PlaylistEditor.prototype.init = function(tracks) {

    var that = this,
        i,
        len,
        div = document.getElementById("tracks"),
        fragment = document.createDocumentFragment(),
        trackEditor,
        trackElem,
        timeScale,
        toolBar,
        bottomBar;

    this.config = new Config();
    this.storage = new Storage();

    this.trackContainer = div;
    this.trackEditors = [];

    toolBar = new ToolBar();
    toolBar.init();

    timeScale = new TimeScale();
    timeScale.init();

    bottomBar = new BottomBar();
    bottomBar.init();

    this.timeScale = timeScale;
    
    for (i = 0, len = tracks.length; i < len; i++) {

        trackEditor = new TrackEditor(this);
        trackElem = trackEditor.loadTrack(tracks[i]);
    
        this.trackEditors.push(trackEditor);
        fragment.appendChild(trackElem);

        toolBar.on("changestate", "onStateChange", trackEditor);
        toolBar.on("trackedit", "onTrackEdit", trackEditor);
        bottomBar.on("changeresolution", "onResolutionChange", trackEditor);

        trackEditor.on("activateSelection", "onAudioSelection", toolBar);
        trackEditor.on("deactivateSelection", "onAudioDeselection", toolBar);
        trackEditor.on("changecursor", "onCursorSelection", bottomBar);
        trackEditor.on("changecursor", "onSelectUpdate", this);
    }

    div.innerHTML = '';
    div.appendChild(fragment);
    div.onscroll = this.onTrackScroll.bind(that);

    this.sampleRate = this.config.getSampleRate();
   
    this.scrollTimeout = false;

    //for setInterval that's toggled during play/stop.
    this.interval;

    this.on("trackscroll", "onTrackScroll", timeScale);
    this.on("playbackcursor", "onAudioUpdate", bottomBar);

    toolBar.on("playlistsave", "save", this);
    toolBar.on("playlistrestore", "restore", this);
    toolBar.on("rewindaudio", "rewind", this);
    toolBar.on("playaudio", "play", this);
    toolBar.on("stopaudio", "stop", this);
    toolBar.on("trimaudio", "onTrimAudio", this);
    toolBar.on("removeaudio", "onRemoveAudio", this);
    toolBar.on("changestate", "onStateChange", this);

    bottomBar.on("changeresolution", "onResolutionChange", timeScale);
    bottomBar.on("changeselection", "onSelectionChange", this);  
};

PlaylistEditor.prototype.onTrimAudio = function() {
    var track = this.activeTrack,
        selected = track.getSelectedArea(),
        start, end;

    if (selected === undefined) {
        return;
    }

    track.trim(selected.start, selected.end); 
};

PlaylistEditor.prototype.onRemoveAudio = function() {
    var track = this.activeTrack,
        selected = track.getSelectedArea(),
        start, end;

    if (selected === undefined) {
        return;
    }

    track.removeAudio(selected.start, selected.end);
};

PlaylistEditor.prototype.onSelectionChange = function(args) {
    
    if (this.activeTrack === undefined) {
        return;
    }

    var res = this.config.getResolution(),
        start = ~~(args.start * this.sampleRate / res),
        end = ~~(args.end * this.sampleRate / res);

    this.config.setCursorPos(start);
    this.activeTrack.setSelectedArea(start, end);
    this.activeTrack.updateEditor(-1);
    this.activeTrack.updateEditor(-1, start, end, true);
};

PlaylistEditor.prototype.onStateChange = function() {
     var that = this,
        editors = this.trackEditors,
        i,
        len,
        editor;

    for(i = 0, len = editors.length; i < len; i++) {
        editors[i].deactivate();
    }
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

PlaylistEditor.prototype.activateTrack = function(trackEditor) {
    var that = this,
        editors = this.trackEditors,
        i,
        len,
        editor;

    for (i = 0, len = editors.length; i < len; i++) {
        editor = editors[i];

        if (editor === trackEditor) {
            editor.activate();
            this.activeTrack = trackEditor;
        }
        else {
            editor.deactivate();
        }
    }
};

PlaylistEditor.prototype.onSelectUpdate = function(event) {
    
    this.activateTrack(event.editor);
};

PlaylistEditor.prototype.resetCursor = function() {
    this.config.setCursorPos(0);
    this.notifySelectUpdate(0, 0);
};

PlaylistEditor.prototype.onCursorSelection = function(args) {
    this.activateTrack(args.editor);
};

PlaylistEditor.prototype.rewind = function() {
    
    if (this.activeTrack !== undefined) {
        this.activeTrack.resetCursor();
    }
    else {
        this.resetCursor();
    } 

    this.stop();
};

/*
    returns selected time in global (playlist relative) seconds.
*/
PlaylistEditor.prototype.getSelected = function() {
    var selected,
        start,
        end;

    if (this.activeTrack) {
        selected = this.activeTrack.selectedArea;
        if (selected !== undefined && (selected.end > selected.start)) {
            return this.activeTrack.getSelectedPlayTime();
        }
    }
};

PlaylistEditor.prototype.isPlaying = function() {
     var that = this,
        editors = this.trackEditors,
        i,
        len,
        isPlaying = false;

    for (i = 0, len = editors.length; i < len; i++) {
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
        startTime = this.config.getCursorPos(),
        endTime,
        selected = this.getSelected();

    if (selected !== undefined) {
        startTime = selected.startTime;
        endTime = selected.endTime;
    }

    for (i = 0, len = editors.length; i < len; i++) {
        editors[i].schedulePlay(currentTime, delay, startTime, endTime);
    }

    this.lastPlay = currentTime + delay;
    this.interval = setInterval(that.updateEditor.bind(that), 25);
};

PlaylistEditor.prototype.stop = function() {
     var editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime();

    clearInterval(this.interval);

    for (i = 0, len = editors.length; i < len; i++) {
        editors[i].scheduleStop(currentTime);
        editors[i].updateEditor(-1, undefined, undefined, true);
    }
};

PlaylistEditor.prototype.updateEditor = function() {
    var editors = this.trackEditors,
        i,
        len,
        currentTime = this.config.getCurrentTime(),
        elapsed = currentTime - this.lastPlay,
        res = this.config.getResolution(),
        cursorPos = this.config.getCursorPos(),
        cursorPixel,
        playbackSec,
        selected = this.getSelected(), 
        start, end,
        highlighted = false;

    if (selected !== undefined) {
        start = ~~(selected.startTime * this.sampleRate / res);
        end = Math.ceil(selected.endTime * this.sampleRate / res);
        highlighted = true;
    }

    if (this.isPlaying()) {

        if (elapsed) {
            playbackSec = cursorPos + elapsed;
            cursorPixel = Math.ceil(playbackSec * this.sampleRate / res);
            
            for(i = 0, len = editors.length; i < len; i++) {
                editors[i].updateEditor(cursorPixel, start, end, highlighted);
            }

            this.fire("playbackcursor", {
                "seconds": playbackSec,
                "pixels": cursorPixel
            });
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

