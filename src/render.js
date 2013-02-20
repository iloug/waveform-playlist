'use strict';

var WaveformDrawer = function() {

    this.buffer = undefined;

    this.defaultParams = {
        resolution: 4096, //resolution - samples per pixel to draw.
        mono: true //whether to draw multiple channels or combine them.
    };
}

WaveformDrawer.prototype.init = function(params) {

    var canv,
        that = this;

    this.buffer = params.buffer;
    this.container = params.container;
    delete params.buffer;
    delete params.container;

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function (key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });

    this.params.sampleLength = this.buffer.getChannelData(0).length;
    this.params.numChan = this.buffer.numberOfChannels;

    this.width = this.params.sampleLength / this.params.resolution;
    this.height = 128;

    canv = document.createElement("canvas");
    canv.setAttribute('width', this.width);
    canv.setAttribute('height', this.height);

    this.canvas = canv;
    this.cc = this.canvas.getContext('2d');

    if (this.container){
        this.container.appendChild(canv);
    }
    else {
        console.error("no container element");
    }
}


WaveformDrawer.prototype.getPeaks = function () {
    
    // Frames per pixel
    var res = this.params.resolution,
        peaks = [],
        i, c, p, l,
        chanLength = this.params.sampleLength,
        pixels = Math.floor(chanLength / res),
        numChan = this.params.numChan,
        weight = 1 / (numChan),
        makeMono = this.params.mono,
        chan, 
        start, 
        end, 
        vals, 
        max, 
        min,
        maxPeak = -Infinity; //used to scale the waveform on the canvas.

    for (var i = 0; i < pixels; i++) {
        
        peaks[i] = [];

        for (c = 0; c < numChan; c++) {

            chan = this.buffer.getChannelData(c);
            start = i * res;
            end = (i + 1) * res > chanLength ? chanLength : (i + 1) * res;
            vals = chan.subarray(start, end);
            max = -Infinity;
            min = Infinity;

            for (p = 0, l = vals.length; p < l; p++) {
                if (vals[p] > max){
                    max = vals[p];
                }
                if (vals[p] < min){
                    min = vals[p];
                }
            }
            peaks[i].push({max:max, min:min});
            maxPeak = Math.max.apply(Math, [maxPeak, Math.abs(max), Math.abs(min)]);
        }
    
        if (makeMono) {
            max = min = 0;

            for (c = 0 ; c < numChan; c++) {
                max = max + weight * peaks[i][c].max;
                min = min + weight * peaks[i][c].min;     
            }

            peaks[i] = {max:max, min:min};

            //TODO? could recalculate maxPeak, but probably won't change too much.
        }
    }

    this.maxPeak = maxPeak;
    this.peaks = peaks;
}

WaveformDrawer.prototype.drawFrame = function(index, peaks, maxPeak) {
    var x, y, w, h, max, min,
        h2 = this.height / 2;

    max = (peaks.max / maxPeak) * h2;
    min = (peaks.min / maxPeak) * h2;

    w = 1;
    x = index * w;
    y = Math.round(h2 - max);
    h = Math.round(max - min);

    //var x = index * w;
    //var y = Math.round((this.height - h) / 2);

    /*
    if (this.cursorPos >= x) {
        this.cc.fillStyle = this.params.progressColor;
    } else {
        this.cc.fillStyle = this.params.waveColor;
    }
    */

    this.cc.fillRect(x, y, w, h);
}

WaveformDrawer.prototype.draw = function () {
    var that = this;

    this.clear();

    // Draw WebAudio buffer peaks.
    if (this.peaks) {
        this.peaks && this.peaks.forEach(function (peak, index) {
            that.drawFrame(index, peak, that.maxPeak);
        });
    }
    else {
        console.error("waveform peaks are not defined.");
    }
}

WaveformDrawer.prototype.clear = function() {
    this.cc.clearRect(0, 0, this.width, this.height);
}
