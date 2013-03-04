'use strict';

var ToolBar = function() {

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
        func;

    this.config = new Config();

    this.tmpl = document.getElementById("top-bar-tmpl");
    this.el = document.getElementById("top-bar");
    this.el.innerHTML = this.tmpl.innerHTML;

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
        state = el.dataset.state;

    this.config.setState(state);
    this.fire('changestate', this);
};

makePublisher(ToolBar.prototype);
