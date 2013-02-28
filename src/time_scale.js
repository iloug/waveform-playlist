'use strict';

var TimeScale = function() {

};

TimeScale.prototype.init = function() {

    var that = this,
        div = document.createElement("div"),
        canv = document.createElement("canvas");

    div.className = div.className + " playlist-time-scale";

    this.canv = canv;
    this.context = canv.getContext('2d');
    
    this.config = new Config();
    this.playlistContainer = this.config.getContainer();

    this.resolution = this.config.getResolution();
    this.sampleRate = this.config.getSampleRate();

    div.appendChild(canv);
    this.playlistContainer.appendChild(div);

    this.container = div; //container for the main time scale.

    //array of divs displaying time every 30 seconds. (TODO should make this depend on resolution)
    this.times = [];

    this.drawScale();
};

/*
    Return time in format mm:ss
*/
TimeScale.prototype.formatTime = function(seconds) {
    var out, m, s;

    s = seconds % 60;
    m = (seconds - s) / 60;

    if (s < 10) {
        s = "0"+s;
    }

    out = m + ":" + s;

    return out;
};

TimeScale.prototype.drawScale = function() {
    var cc = this.context,
        canv = this.canv,
        colors = this.config.getColorScheme(),
        pixPerSec = this.sampleRate/this.resolution,
        i = 0,
        counter = 0,
        pixIndex,
        container = this.container,
        width = container.clientWidth,
        height = container.clientHeight,
        div,
        time,
        sTime,
        fragment = document.createDocumentFragment();

    canv.setAttribute('width', width);
    canv.setAttribute('height', height);

    cc.fillStyle = colors.timeColor;

    //draw ticks every 5 seconds.
    for (; i < width; i = i + pixPerSec) {

        pixIndex = ~~(i);

        //put a timestamp every 30 seconds.
        if (counter % 30 === 0) {

            sTime = this.formatTime(counter);
            time = document.createTextNode(sTime);
            div = document.createElement("div");
    
            div.style.left = pixIndex+"px";
            div.appendChild(time);
            fragment.appendChild(div);

            cc.fillRect(pixIndex, height - 10, 1, 10);
        }
        else if (counter % 5 === 0) {
            cc.fillRect(pixIndex, height - 5, 1, 5);
        }
        else {
            cc.fillRect(pixIndex, height - 2, 1, 2);
        }

        counter++;   
    }

    container.appendChild(fragment); 
};
