'use strict';

var BottomBar = function() {

};

BottomBar.prototype.events = {
   "btn_rewind": {
        click: "rewindAudio"
    }
};

BottomBar.prototype.init = function() {
    var that = this,
        id,
        event,
        events = this.events,
        tmpEl,
        func;

    this.config = new Config();
    
    this.tmpl = document.getElementById("bottom-bar-tmpl");
    this.el = document.getElementById("bottom-bar");
    this.el.innerHTML = this.tmpl.innerHTML;

    for (id in events) {
    
        tmpEl = document.getElementById(id);

        for (event in events[id]) {

            func = that[events[id][event]].bind(that);
            tmpEl.addEventListener(event, func);
        }
    } 
};
