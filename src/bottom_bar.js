'use strict';

var BottomBar = function() {

};

BottomBar.prototype.formatters = function(format) {

    function clockFormat(seconds, decimals) {
        var hours,
            minutes,
            secs,
            result;

        hours = parseInt(seconds / 3600, 10) % 24;
        minutes = parseInt(seconds / 60, 10) % 60;
        secs = seconds % 60;
        secs = secs.toFixed(decimals);

        result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs  < 10 ? "0" + secs : secs);

        return result;
    }

    var formats = {
        "seconds": function (seconds) {
            return seconds.toFixed(0);
        },

        "thousandths": function (seconds) {
            return seconds.toFixed(3);
        },

        "hh:mm:ss": function (seconds) {
            return clockFormat(seconds, 0);   
        },

        "hh:mm:ss.uu": function (seconds) {
            return clockFormat(seconds, 2);   
        },

        "hh:mm:ss.uuu": function (seconds) {
            return clockFormat(seconds, 3);   
        }
    };

    return formats[format];
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

    this.timeFormat = document.getElementById('time_format');
    this.audioStart = document.getElementById('audio_start');
    this.audioEnd = document.getElementById('audio_end');
    this.audioCurrent = document.getElementById('audio_pos');
    this.audioResolution = document.getElementById('audio_resolution');

    this.timeFormat.value = this.config.getTimeFormat();
    this.audioResolution.value = this.config.getResolution();

    this.timeFormat.onchange = function(e) {
        var format = e.target.value;

        format = (that.formatters(format) !== undefined) ? format : "hh:mm:ss";
        that.config.setTimeFormat(format);
        that.timeFormat = format;
    };

    this.audioResolution.onchange = function(e) {
        var res = parseInt(e.target.value, 10);
        that.config.setResolution(res);
        that.fire("changeresolution", res);
    };

    this.timeFormat = "hh:mm:ss";
};

/*
    start, end in seconds
*/
BottomBar.prototype.onCursorSelection = function(args) {
    this.audioStart.value = this.formatters(this.timeFormat)(args.start);
    this.audioEnd.value = this.formatters(this.timeFormat)(args.end);
};

/*
    args {seconds, pixels}
*/
BottomBar.prototype.onAudioUpdate = function(args) {
    this.audioCurrent.value = this.formatters(this.timeFormat)(args.seconds); 
};

makePublisher(BottomBar.prototype);
