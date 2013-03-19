'use strict';

var BottomBar = function() {

};

BottomBar.prototype.formatters = {
   "seconds": function (value) {
        return value.toFixed(0);
    },

    "thousandths": function (value) {
        return value.toFixed(3);
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
    this.audioResolution = document.getElementById('audio_resolution');

    this.audioResolution.onchange = function(e) {
        var res = parseInt(e.target.value, 10);
        that.config.setResolution(res);
        that.fire("changeresolution", res);
    };

    this.timeFormat = "thousandths";
};

/*
    start, end in seconds
*/
BottomBar.prototype.onCursorSelection = function(args) {
    this.audioStart.value = this.formatters[this.timeFormat](args.start);
    this.audioEnd.value = this.formatters[this.timeFormat](args.end);
};

/*
    args {seconds, pixels}
*/
BottomBar.prototype.onAudioUpdate = function(args) {
    this.audioCurrent.value = this.formatters[this.timeFormat](args.seconds); 
};

makePublisher(BottomBar.prototype);
