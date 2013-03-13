'use strict';

var ToolBar = function() {

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

    "btns-fade": {
        click: "createFade"
    },

    "btn_save": {
        click: "save"
    },

    "btn_open": {
        click: "open"
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

ToolBar.prototype.activateFades = function() {
    var el = document.getElementById("btns-fade"),
        btns = el.getElementsByTagName("a"),
        classes = this.classes,
        i, len;

    for (i = 0, len = btns.length; i < len; i++) {
        btns[i].classList.remove(classes["disabled"]);
    }
};

ToolBar.prototype.deactivateFades = function() {
    var el = document.getElementById("btns-fade"),
        btns = el.getElementsByTagName("a"),
        classes = this.classes,
        i, len;

    for (i = 0, len = btns.length; i < len; i++) {
        btns[i].classList.add(classes["disabled"]);
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

ToolBar.prototype.createFade = function(e) {
    var el = e.target,
        shape = el.dataset.shape,
        type = el.dataset.type,
        disabled,
        classes = this.classes;

    disabled = el.classList.contains(classes["disabled"]);

    if (!disabled) {
        this.fire('createfade', {
            type: type, 
            shape: shape
        });
    }  
};

makePublisher(ToolBar.prototype);
