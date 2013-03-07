'use strict';

var ToolBar = function() {

};

ToolBar.prototype.classes = {
    "btn-state-active": "btn btn-mini active",
    "btn-state-default": "btn btn-mini"
};

ToolBar.prototype.events = {
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

    this.fire('createfade', this);
};

makePublisher(ToolBar.prototype);
