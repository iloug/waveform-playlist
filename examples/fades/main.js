var BUFFERS_TO_LOAD = {
    kick:'sounds/kick.wav',
    snare:'sounds/snare.wav',
    hihat:'sounds/hihat.wav',
    jam:'sounds/br-jam-loop.wav',
    crowd:'sounds/clapping-crowd.wav',
    drums:'sounds/blueyellow.wav',
    organ:'sounds/organ-echo-chords.wav',
    techno:'sounds/techno.wav'
};

var context = new webkitAudioContext();

function createSource(buffer){
    var source = context.createBufferSource();
    var gainNode = context.createGainNode();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);

    return {
        source: source,
        gainNode: gainNode
    };
}

var fadeTest = function(buffers) {
    var buffer = buffers.techno;
    var ctrls = createSource(buffer);
    var duration = buffer.duration;
    var fadeTime = 3;
    var currTime = context.currentTime;

/*
    var opts = {
        start: currTime,
        duration: currTime + fadeTime,
        base: 10 
    };

    fades.createFadeIn(ctrls.gainNode.gain, "logarithmic", opts);
*/


    var opts = {
        start: currTime + duration - fadeTime,
        duration: currTime + duration 
    };

    fades.createFadeOut(ctrls.gainNode.gain, "logarithmic", opts);

    ctrls.source.noteOn(0);
}

var bufferLoader = new BufferLoader();
bufferLoader.init({
    context: context,
    onComplete: fadeTest
});
bufferLoader.loadAudio(BUFFERS_TO_LOAD);
var fades = new Fades();
fades.init({
    context: context
});
