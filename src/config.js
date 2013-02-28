/*
    Stores configuration settings for the playlist builder.
    A container object (ex a div) must be passed in, the playlist will be built on this element.
*/
var Config;

(function() {

    var that,
        defaultParams;

    Config = function Config(container, params) {

        if (that) {
            return that;
        }

        that = this;

        defaultParams = {

            ac: new (window.AudioContext || window.webkitAudioContext),

            resolution: 4096, //resolution - samples per pixel to draw.
            mono: true, //whether to draw multiple channels or combine them.

            waveColor: 'grey',
            progressColor: 'purple',
            loadingColor: 'purple',
            cursorColor: 'green',
            markerColor: 'green',

            timeColor: 'grey',
            fontColor: 'black',

            waveHeight: 128 //height of each canvas element a waveform is on.
        };

        params = Object.create(params);
        Object.keys(defaultParams).forEach(function(key) {
            if (!(key in params)) { 
                params[key] = defaultParams[key]; 
            }
        });


        /*
            Start of all getter methods for config.
        */

        that.isDisplayMono = function isDisplayMono() {
            return params.mono;
        };

        that.getContainer = function getContainer() {
            return container;
        };

        that.getAudioContext = function getAudioContext() {
            return params.ac;
        };

        that.getSampleRate = function getSampleRate() {
            return params.ac.sampleRate;
        };

        that.getCurrentTime = function getCurrentTime() {
            return params.ac.currentTime;
        };

        that.getResolution = function getResolution() {
            return params.resolution;
        };

        that.getWaveHeight = function getWaveHeight() {
            return params.waveHeight;
        };

        that.getColorScheme = function getColorScheme() {
            return {
                waveColor: params.waveColor,
                progressColor: params.progressColor,
                loadingColor: params.loadingColor,
                cursorColor: params.cursorColor,
                markerColor: params.markerColor,
                timeColor: params.timeColor,
                fontColor: params.fontColor 
            };
        };


        /*
            Start of all setter methods for config.
        */

        that.setResolution = function setResolution(resolution) {
            params.resolution = resolution;
        };

        that.setDisplayMono = function setDisplayMono(bool) {
            params.mono = bool;
        };

    };

}());
