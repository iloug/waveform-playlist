Fades = function() {};

Fades.prototype.init = function init(params) {
    var that = this;

    //creating a curve to simulate an S-curve with setValueCurveAtTime.
    function createSCurveBuffer(length, phase) {
        var curve = new Float32Array(length);

        for (var i = 0; i < length; ++i) {
            curve[i] = (Math.sin((Math.PI * i / length) - phase))/2 + 0.5;
        }
        return curve;
    }

    //creating a curve to simulate a logarithmic curve with setValueCurveAtTime.
    function createLogarithmicBuffer(length, base, rotation) {
        var curve = new Float32Array(length),
            scale = Math.log(length + 1) / Math.log(base),
            index;

        //starting at 1 to avoid a negative infinity.
        for (var i = 1; i < length + 1; ++i) {
            index = rotation > 0 ? i - 1 : length - i;
            curve[index] = (Math.log(i) / Math.log(base)) / scale;
        }

        return curve;
    }

    that.context = params.context;
    
    that.defaultParams = {
        
    };

    that.params = Object.create(params);
    Object.keys(that.defaultParams).forEach(function (key) {
        if (!(key in params)) { params[key] = that.defaultParams[key]; }
    }); 

    that.sCurveIn = createSCurveBuffer(that.context.sampleRate, (Math.PI/2));
    that.sCurveOut = createSCurveBuffer(that.context.sampleRate, -(Math.PI/2));

    that.logCurveIn = createLogarithmicBuffer(that.context.sampleRate, 3, 1);
    that.logCurveOut = createLogarithmicBuffer(that.context.sampleRate, 3, -1)   
}
   
Fades.prototype.sCurveFadeIn = function sCurveFadeIn(gain, start, duration) {

    gain.setValueCurveAtTime(this.sCurveIn, start, duration);
};

Fades.prototype.sCurveFadeOut = function sCurveFadeOut(gain, start, duration) {

    gain.setValueCurveAtTime(this.sCurveOut, start, duration);
};

Fades.prototype.linearFadeIn = function linearFadeIn(gain, start, duration) {

    gain.linearRampToValueAtTime(0, start);
    gain.linearRampToValueAtTime(1, start + duration);
};

Fades.prototype.linearFadeOut = function linearFadeOut(gain, start, duration) {

    gain.linearRampToValueAtTime(1, start);
    gain.linearRampToValueAtTime(0, start + duration);
};

/*
DOES NOT SEEM TO WORK PROPERLY USING 0
*/
Fades.prototype.exponentialFadeIn = function exponentialFadeIn(gain, start, duration) {

    gain.exponentialRampToValueAtTime(0.01, start);
    gain.exponentialRampToValueAtTime(1, start + duration);
};

Fades.prototype.exponentialFadeOut = function exponentialFadeOut(gain, start, duration) {

    gain.exponentialRampToValueAtTime(1, start);
    gain.exponentialRampToValueAtTime(0.01, start + duration);
};

Fades.prototype.logarithmicFadeIn = function logarithmicFadeIn(gain, start, duration, base) {

    base = typeof base !== 'undefined' ? base : 2;
    gain.setValueCurveAtTime(this.logCurveIn, start, duration);
};

Fades.prototype.logarithmicFadeOut = function logarithmicFadeOut(gain, start, duration, base) {

    base = typeof base !== 'undefined' ? base : 2;
    gain.setValueCurveAtTime(this.logCurveOut, start, duration);
};

/**
    Calls the appropriate fade type with options

    options {
        start,
        duration,
        base (for logarithmic)
    }
*/
Fades.prototype.createFadeIn = function createFadeIn(gain, type, options) {
    var method = type + "FadeIn",
        fn = this[method];

        fn.call(this, gain, options.start, options.duration, options);
};

Fades.prototype.createFadeOut = function createFadeOut(gain, type, options) {
    var method = type + "FadeOut",
        fn = this[method];

        fn.call(this, gain, options.start, options.duration, options);
};
