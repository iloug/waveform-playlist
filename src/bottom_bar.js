'use strict';

var BottomBar = function() {

};

BottomBar.prototype.formatters = {
   "seconds": function (value) {

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

    this.audioStart = document.getElementById('audio_start');
    this.audioEnd = document.getElementById('audio_end');
    this.audioCurrent = document.getElementById('audio_pos');
};

/*
    start, end in seconds
*/
BottomBar.prototype.onCursorSelection = function(args) {
    this.audioStart.value = args.start;
    this.audioEnd.value = args.end;
};

/*
    currentTime in seconds
*/
BottomBar.prototype.onAudioUpdate = function(currentTime) {
   
};

makePublisher(ToolBar.prototype);
