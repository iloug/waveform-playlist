'use strict';

var ToolBar = function() {

};

ToolBar.prototype.groups = {
    "audio-select": ["btns_audio_tools", "btns_fade"]
};

ToolBar.prototype.classes = {
    "btn-state-active": "btn btn-mini active",
    "btn-state-default": "btn btn-mini",
    "disabled": "disabled",
    "active": "active"
};

ToolBar.prototype.events = {
   "btn_rewind": {
        click: "rewindAudio"
    },

   "btn_play": {
        click: "playAudio"
    },
 
    "btn_stop": {
        click: "stopAudio"
    },

    "btn_select": {
        click: "changeState"
    },

    "btn_shift": {
        click: "changeState"
    },

    "btns_fade": {
        click: "createFade"
    },

    "btn_save": {
        click: "save"
    },

    "btn_open": {
        click: "open"
    },
    
    "btn_trim_audio": {
        click: "trimAudio"
    }
};

ToolBar.prototype.init = function() {
    var that = this,
        id,
        event,
        events = this.events,
        tmpEl,
        func,
        state;

    this.config = new Config();
    state = this.config.getState();

    this.tmpl = document.getElementById("top-bar-tmpl");
    this.el = document.getElementById("top-bar");
    this.el.innerHTML = this.tmpl.innerHTML;

    document.getElementById("btn_"+state).className = this.classes["btn-state-active"];

    for (id in events) {
    
        tmpEl = document.getElementById(id);

        for (event in events[id]) {

            func = that[events[id][event]].bind(that);
            tmpEl.addEventListener(event, func);
        }
    } 
};

ToolBar.prototype.activateButtonGroup = function(id) {
    var el = document.getElementById(id),
        btns = el.getElementsByTagName("a"),
        classes = this.classes,
        i, len;

    for (i = 0, len = btns.length; i < len; i++) {
        btns[i].classList.remove(classes["disabled"]);
    }
};

ToolBar.prototype.deactivateButtonGroup = function(id) {
    var el = document.getElementById(id),
        btns = el.getElementsByTagName("a"),
        classes = this.classes,
        i, len;

    for (i = 0, len = btns.length; i < len; i++) {
        btns[i].classList.add(classes["disabled"]);
    }
};

ToolBar.prototype.activateAudioSelection = function() {
    var ids = this.groups["audio-select"],
        i, len;

    for (i = 0, len = ids.length; i < len; i++) {
        this.activateButtonGroup(ids[i]);
    }
};

ToolBar.prototype.deactivateAudioSelection = function() {
    var ids = this.groups["audio-select"],
        i, len;

    for (i = 0, len = ids.length; i < len; i++) {
        this.deactivateButtonGroup(ids[i]);
    }
};

ToolBar.prototype.save = function() {

    this.fire('playlistsave', this);
};

ToolBar.prototype.open = function() {

    this.fire('playlistrestore', this);
};

ToolBar.prototype.rewindAudio = function() {

    this.fire('rewindaudio', this);
};

ToolBar.prototype.playAudio = function() {

    this.fire('playaudio', this);
};

ToolBar.prototype.stopAudio = function() {

    this.fire('stopaudio', this);
};

ToolBar.prototype.changeState = function(e) {
    var el = e.currentTarget,
        state = el.dataset.state,
        classes = this.classes;

    this.el.getElementsByClassName('active')[0].className = classes["btn-state-default"];

    el.className = classes["btn-state-active"];

    this.config.setState(state);
    this.fire('changestate', this);
};

ToolBar.prototype.zeroCrossing = function(e) {
    var el = e.target,
        disabled,
        classes = this.classes;

    disabled = el.classList.contains(classes["disabled"]);

    if (!disabled) {
        this.fire('trackedit', {
            type: "zeroCrossing"
        });
    }  
};

ToolBar.prototype.trimAudio = function(e) {
    var el = e.target,
        disabled,
        classes = this.classes;

    disabled = el.classList.contains(classes["disabled"]);

    if (!disabled) {
        this.fire('trackedit', {
            type: "trimAudio"
        });
    }  
};

ToolBar.prototype.removeAudio = function(e) {
    var el = e.target,
        disabled,
        classes = this.classes;

    disabled = el.classList.contains(classes["disabled"]);

    if (!disabled) {
        this.fire('trackedit', {
            type: "removeAudio"
        });
    }  
};

ToolBar.prototype.createFade = function(e) {
    var el = e.target,
        shape = el.dataset.shape,
        type = el.dataset.type,
        disabled,
        classes = this.classes;

    disabled = el.classList.contains(classes["disabled"]);

    if (!disabled) {
        this.fire('trackedit', {
            type: "createFade",
            args: {
                type: type, 
                shape: shape
            }
        });
    }  
};

ToolBar.prototype.onAudioSelection = function() {
    this.activateAudioSelection();
};

ToolBar.prototype.onAudioDeselection = function() {
    this.deactivateAudioSelection();
};

makePublisher(ToolBar.prototype);
