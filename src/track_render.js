'use strict';

var WaveformDrawer = function() {

};

WaveformDrawer.prototype.init = function(container) {

    var that = this;

    this.config = new Config();
    this.container = container;
    this.channels = []; //array of canvases, contexts, 1 for each channel displayed.
};

WaveformDrawer.prototype.getPeaks = function(buffer) {
    
    // Frames per pixel
    var res = this.config.getResolution(),
        peaks = [],
        i, c, p, l,
        chanLength = buffer.getChannelData(0).length,
        pixels = ~~(chanLength / res),
        numChan = buffer.numberOfChannels,
        weight = 1 / (numChan),
        makeMono = this.config.isDisplayMono(),
        chan, 
        start, 
        end, 
        vals, 
        max, 
        min,
        maxPeak = -Infinity; //used to scale the waveform on the canvas.

    for (i = 0; i < pixels; i++) {
        
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

            peaks[i] = []; //need to clear out old stuff (maybe we should keep it for toggling views?).
            peaks[i].push({max:max, min:min});
        }
    }

    this.maxPeak = maxPeak;
    this.peaks = peaks;
};

WaveformDrawer.prototype.setTimeShift = function(pixels) {
    var i, len;

    for (i=0, len = this.channels.length; i < len; i++) {
        this.channels[i].canvas.style.left = pixels+"px";
    } 
};

WaveformDrawer.prototype.drawBuffer = function(buffer, sampleOffset) {
    var canv,
        div,
        i,
        makeMono = this.config.isDisplayMono(),
        res = this.config.getResolution(),
        numChan = makeMono? 1 : buffer.numberOfChannels,
        numSamples = buffer.getChannelData(0).length,
        fragment = document.createDocumentFragment();    

    //width and height is per waveform canvas.
    this.width = Math.ceil(numSamples / res);
    this.height = this.config.getWaveHeight();

    for (i=0; i < numChan; i++) {

        div = document.createElement("div");
        div.style.width = this.width+"px";
        div.style.height = this.height+"px";

        canv = document.createElement("canvas");
        canv.setAttribute('width', this.width);
        canv.setAttribute('height', this.height);

        this.channels.push({
            canvas: canv,
            context: canv.getContext('2d')
        });

        div.appendChild(canv);
        fragment.appendChild(div);
    }
  
    this.container.appendChild(fragment);
    

    this.getPeaks(buffer);
    this.updateEditor();

    this.setTimeShift(sampleOffset/res);
};

WaveformDrawer.prototype.drawFrame = function(chanNum, index, peaks, maxPeak, cursorPos, pixelOffset) {
    var x, y, w, h, max, min,
        h2 = this.height / 2,
        cc = this.channels[chanNum].context,
        colors = this.config.getColorScheme();

    max = (peaks.max / maxPeak) * h2;
    min = (peaks.min / maxPeak) * h2;

    w = 1;
    x = index * w;
    y = Math.round(h2 - max);
    h = Math.ceil(max - min);

    //to prevent blank space when there is basically silence in the track.
    h = h === 0 ? 1 : h; 

    if (cursorPos >= (x + pixelOffset)) {
        cc.fillStyle = colors.progressColor;
    } 
    else {
        cc.fillStyle = colors.waveColor;
    }

    cc.fillRect(x, y, w, h);
};

/*
    start, end are optional parameters to only redraw part of the canvas.
*/
WaveformDrawer.prototype.draw = function(cursorPos, pixelOffset, start, end) {
    var that = this,
        peaks = this.peaks,
        i = (start) ? start - pixelOffset : 0,
        len = (end) ? end - pixelOffset + 1 : peaks.length;

    this.clear(start, end, pixelOffset);
 
    for (; i < len; i++) {

        peaks[i].forEach(function(peak, chanNum) {
            that.drawFrame(chanNum, i, peak, that.maxPeak, cursorPos, pixelOffset);
        });
    }
};

/*
    If start/end are set clear only part of the canvas.
*/
WaveformDrawer.prototype.clear = function(start, end, pixelOffset) {
    var i, len,
        start = start || 0,
        end = end || this.width,
        width = end - start + 1,
        startPix = start - pixelOffset;

    for (i = 0, len = this.channels.length; i < len; i++) {
        this.channels[i].context.clearRect(startPix, 0, width, this.height);
    } 
};

WaveformDrawer.prototype.updateEditor = function(cursorPos, pixelOffset) {
    
    this.draw(cursorPos, pixelOffset);
};

/*
    start, end in pixels.
*/
WaveformDrawer.prototype.drawHighlight = function(start, end, isBorder, pixelOffset) {
    var i, len,
        colors = this.config.getColorScheme(),
        fillStyle,
        ctx,
        startPix = start - pixelOffset,
        width = end - start + 1;

    fillStyle = (isBorder) ? colors.selectBorderColor : colors.selectBackgroundColor;

    for (i = 0, len = this.channels.length; i < len; i++) {
        ctx = this.channels[i].context;
        ctx.fillStyle = fillStyle;
        ctx.fillRect(startPix, 0, width, this.height);
    }
};

makePublisher(WaveformDrawer.prototype);
