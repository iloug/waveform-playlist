'use strict';

var WaveformDrawer = function() {

    this.defaultParams = {
        resolution: 4096, //resolution - samples per pixel to draw.
        mono: true, //whether to draw multiple channels or combine them.
        waveColor: 'violet',
        progressColor: 'purple',
        loadingColor: 'purple',
        cursorColor: 'green',
        markerColor: 'green',
        waveHeight: 128
    };
}

WaveformDrawer.prototype.init = function(params) {

    var that = this;

    this.container = params.container;
    delete params.container;

    this.params = Object.create(params);
    Object.keys(this.defaultParams).forEach(function (key) {
        if (!(key in params)) { 
            params[key] = that.defaultParams[key]; 
        }
    });
}

WaveformDrawer.prototype.getPeaks = function(buffer) {
    
    // Frames per pixel
    var res = this.params.resolution,
        peaks = [],
        i, c, p, l,
        chanLength = this.params.sampleLength,
        pixels = ~~(chanLength / res),
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

            chan = buffer.getChannelData(c);
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
        }
    }

    this.maxPeak = maxPeak;
    this.peaks = peaks;
}

//TODO move this to a better location, just for trying out.
//will move the waveform only changing the x-axis.
//a mousedown event.
WaveformDrawer.prototype.timeShift = function(e) {
    var startX = e.pageX, 
        diffX = 0, 
        origX = 0;

    origX = parseInt(e.target.style.left, 10);
    if (isNaN(origX)) origX = 0;
    
    e.target.onmousemove = function(e) {
        var endX = e.pageX,
            updatedX = 0;
        
        diffX = endX - startX;
        updatedX = origX + diffX;
        e.target.style.left = updatedX+"px";
    };
    e.target.onmouseup = function() {
        
        e.target.onmousemove = e.target.onmouseup = null;
    };
};

WaveformDrawer.prototype.drawBuffer = function (buffer) {
    var canv;    

    this.params.sampleLength = buffer.getChannelData(0).length;
    this.params.numChan = buffer.numberOfChannels;

    this.width = Math.ceil(this.params.sampleLength / this.params.resolution);
    this.height = this.params.waveHeight;

    canv = document.createElement("canvas");
    canv.setAttribute('width', this.width);
    canv.setAttribute('height', this.height);

    canv.onmousedown = this.timeShift;

    this.canvas = canv;
    this.cc = this.canvas.getContext('2d');

    if (this.container){
        this.container.appendChild(canv);
    }
    else {
        console.error("no container element");
    }

    this.getPeaks(buffer);
    this.updateEditor(0, 0);
};

WaveformDrawer.prototype.drawFrame = function(index, peaks, maxPeak) {
    var x, y, w, h, max, min,
        h2 = this.height / 2;

    max = (peaks.max / maxPeak) * h2;
    min = (peaks.min / maxPeak) * h2;

    w = 1;
    x = index * w;
    y = Math.round(h2 - max);
    h = Math.ceil(max - min);

    //to prevent blank space when there is basically silence in the track.
    h = h === 0 ? 1 : h; 

    if (this.cursorPos >= x) {
        this.cc.fillStyle = this.params.progressColor;
    } 
    else {
        this.cc.fillStyle = this.params.waveColor;
    }

    this.cc.fillRect(x, y, w, h);
}

WaveformDrawer.prototype.draw = function() {
    var that = this;

    this.clear();

    // Draw WebAudio buffer peaks.
    if (this.peaks) {
        this.peaks && this.peaks.forEach(function(peak, index) {
            that.drawFrame(index, peak, that.maxPeak);
        });
    }
    else {
        console.error("waveform peaks are not defined.");
    }

    this.drawMarker();
    this.drawCursor();
}

WaveformDrawer.prototype.clear = function() {
    this.cc.clearRect(0, 0, this.width, this.height);
}

WaveformDrawer.prototype.updateEditor = function(marker, percents) {
    //That ~~ is a double NOT bitwise operator.
    //It is used as a faster substitute for Math.floor().
    //http://stackoverflow.com/questions/5971645/what-is-the-double-tilde-operator-in-javascript
    
    this.markerPos = marker;
    this.cursorPos = ~~(this.width * percents);
    this.draw();

}

WaveformDrawer.prototype.drawMarker = function() {
    var h = this.height,
        x = this.markerPos,
        y = 0,
        w = 1;

    this.cc.fillStyle = this.params.markerColor;
    this.cc.fillRect(x, y, w, h);
}

WaveformDrawer.prototype.drawCursor = function() {
    var h = this.height,
        x = this.cursorPos,
        y = 0,
        w = 1;

    this.cc.fillStyle = this.params.cursorColor;
    this.cc.fillRect(x, y, w, h);
}
