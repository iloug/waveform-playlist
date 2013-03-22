'use strict';

var BottomBar = function() {

};

BottomBar.prototype.validate = function(value) {
    var validators,
        regex,
        result;

    validators = {
        "seconds": /^\d+$/,

        "thousandths": /^\d+\.\d{3}$/,

        "hh:mm:ss": /^[0-9]{2,}:[0-5][0-9]:[0-5][0-9]$/,

        "hh:mm:ss.uu": /^[0-9]{2,}:[0-5][0-9]:[0-5][0-9]\.\d{2}$/,

        "hh:mm:ss.uuu": /^[0-9]{2,}:[0-5][0-9]:[0-5][0-9]\.\d{3}$/
    };

    regex = validators[this.timeFormat];
    result = regex.test(value);

    return result;
};

BottomBar.prototype.toSeconds = function(value) {
    var converter,
        func,
        seconds;

    function clockConverter(value) {
        var data = value.split(":"),
            hours = parseInt(data[0], 10) * 3600,
            mins = parseInt(data[1], 10) * 60,
            secs = parseFloat(data[2]),
            seconds;

        seconds = hours + mins + secs;

        return seconds;
    }

    converter = {
        "seconds": function(value) {
            return parseInt(value, 10);
        },

        "thousandths": function(value) {
            return parseFloat(value);
        },

        "hh:mm:ss": function(value) {
            return clockConverter(value);
        },

        "hh:mm:ss.uu": function(value) {
            return clockConverter(value);
        },

        "hh:mm:ss.uuu": function(value) {
            return clockConverter(value);
        } 
    };

    func = converter[this.timeFormat];
    seconds = func(value);

    return seconds;
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

        result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);

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
        var format = e.target.value,
            func, start, end;

        format = (that.formatters(format) !== undefined) ? format : "hh:mm:ss";
        that.config.setTimeFormat(format);
        that.timeFormat = format;

        if (that.currentSelectionValues !== undefined) {
            func = that.formatters(format);
            start = that.currentSelectionValues.start;
            end = that.currentSelectionValues.end;

            that.audioStart.value = func(start);
            that.audioEnd.value = func(end);
        }
    };

    this.audioResolution.onchange = function(e) {
        var res = parseInt(e.target.value, 10);
        that.config.setResolution(res);
        that.fire("changeresolution", res);
    };

    this.timeFormat = this.config.getTimeFormat();

    //Kept in seconds so time format change can update fields easily.
    this.currentSelectionValues = undefined;

    this.audioStart.onblur = function(e) {
        var value = e.target.value,
            end,
            startSecs;

        if (that.validate(value)) {
            end = that.currentSelectionValues.end;
            startSecs = that.toSeconds(value);

            if (startSecs <= end) {
                that.notifySelectionUpdate(startSecs, end);
                that.currentSelectionValues.start = startSecs;
                return;
            }
        }

        //time entered was otherwise invalid.
        this.value = that.formatters(that.timeFormat)(that.currentSelectionValues.start);
    };

    this.audioEnd.onblur = function(e) {
        var value = e.target.value,
            start,
            endSecs;

        if (that.validate(value)) {
            start = that.currentSelectionValues.start;
            endSecs = that.toSeconds(value);

            if (endSecs >= start) {
                that.notifySelectionUpdate(start, endSecs);
                that.currentSelectionValues.end = endSecs;
                return;
            }
        }

        //time entered was otherwise invalid.
        this.value = that.formatters(that.timeFormat)(that.currentSelectionValues.end);
    };
};

/*
    start, end in seconds
*/
BottomBar.prototype.notifySelectionUpdate = function(start, end) {
    
    this.fire('changeselection', {
        start: start,
        end: end
    });
}; 

/*
    start, end in seconds
*/
BottomBar.prototype.onCursorSelection = function(args) {
    var startFormat = this.formatters(this.timeFormat)(args.start),
        endFormat = this.formatters(this.timeFormat)(args.end),
        start = this.toSeconds(startFormat),
        end = this.toSeconds(endFormat);

    this.currentSelectionValues = {
        start: start,
        end:end
    };

    this.audioStart.value = startFormat;
    this.audioEnd.value = endFormat;
};

/*
    args {seconds, pixels}
*/
BottomBar.prototype.onAudioUpdate = function(args) {
    this.audioCurrent.value = this.formatters(this.timeFormat)(args.seconds); 
};

makePublisher(BottomBar.prototype);
