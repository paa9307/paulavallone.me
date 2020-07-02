var app = app || {};

app.main = (function(){
"use strict";

//window.onload = init;

// SCRIPT SCOPED VARIABLES

// 1- here we are faking an enumeration - we'll look at another way to do this soon 
let sound_path;

// 2 - elements on the page
let audioElement, canvasElement;

// UI
let playButton;

// 3 - our canvas drawing context
let drawCtx;

// 4 - our WebAudio context
let audioCtx;

// 5 - nodes that are part of our WebAudio audio routing graph
let sourceNode, analyserNode, gainNode, compressorNode;

// 6 - a typed array to hold the audio frequency data
let num_samples;
// create a new array of 8-bit integers (0-255)
let audioData;

//variables used for various behaviors
let rotation;
let direction;
let moveWave;
let waveDir;
let waveHeight;
let paused;
let aData;
let aData2;
let gradient;
let bar;
let audio;
let cloud1;
let cloud2;
let cloudSpeed;
let peak;
let threshVal;

//26 - these will help with our pixel effects
let invert, tint, noise, sepia, delayAmount, delayNode, frequency, waveform, both;



// FUNCTIONS called at load of page
function init() {
    sound_path = Object.freeze({
        sound1: "media/Yo Ho, Yo Ho!.mp3",
        sound2: "media/Pirates Of The Caribbean.mp3",
        sound3: "media/Drunken Sailor.mp3"
    });
    // 6 - a typed array to hold the audio frequency data
    num_samples = 32;
    // create a new array of 8-bit integers (0-255)
    audioData = new Uint8Array(num_samples / 2);

    //variables used for various behaviors
    rotation = 0.0;
    direction = -1;
    moveWave = 0;
    waveDir = -1;
    waveHeight = 250;
    paused = true;
    aData = 0;
    aData2 = 0;
    //gradient;
  //  bar;
    //audio;
    cloud1 = 0;
    cloud2 = 0;
    cloudSpeed = 0.1;
    peak = 0;
    threshVal = 1;

    //26 - these will help with our pixel effects
    invert = false, tint = false, noise = false, sepia = false, delayAmount = 0.5, delayNode, frequency = true, waveform = false, both = false;

    setupWebaudio();
    setupCanvas();
    createGradient();
    setupUI();
    update();
}


function setupWebaudio() {
    // 1 - The || is because WebAudio has not been standardized across browsers yet
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // 2 - get a reference to the <audio> element on the page
    audioElement = document.querySelector("audio");
    audioElement.src = sound_path.sound3;

    // 3 - create an a source node that points at the <audio> element
    sourceNode = audioCtx.createMediaElementSource(audioElement);


    //create Delay node instance
    delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = delayAmount;

    // 4 - create an analyser node
    analyserNode = audioCtx.createAnalyser();

    /*
    We will request NUM_SAMPLES number of samples or "bins" spaced equally 
    across the sound spectrum.
    
    If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
    the third is 344Hz. Each bin contains a number between 0-255 representing 
    the amplitude of that frequency.
    */

    // fft stands for Fast Fourier Transform
    analyserNode.fftSize = num_samples;

    // 5 - create a gain (volume) node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 1;


    //create a compressor node to stop peaking //this settup code otained from https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.setValueAtTime(-50, audioCtx.currentTime);
    compressorNode.knee.setValueAtTime(20, audioCtx.currentTime);
    compressorNode.ratio.setValueAtTime(20, audioCtx.currentTime);
    compressorNode.attack.setValueAtTime(0, audioCtx.currentTime);
    compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

    // 6 - connect the nodes - we now have an audio graph
    // sourceNode.connect(analyserNode);
    // analyserNode.connect(gainNode);
    // gainNode.connect(audioCtx.destination);

    //connect source directly to speakers
    sourceNode.connect(gainNode); //will play both origonal and delayedc/altered track

    //this channel will play and vizualize the delay
    sourceNode.connect(delayNode);
    delayNode.connect(analyserNode);
    analyserNode.connect(gainNode);
    gainNode.connect(compressorNode);
    compressorNode.connect(audioCtx.destination);
    //gainNode.connect(audioCtx.destination);
}

//gets canvas tag and creates a context
function setupCanvas() {
    canvasElement = document.querySelector('canvas');
    drawCtx = canvasElement.getContext("2d");
}

//create a vertical gradient for use later as the sky 
function createGradient() {
    gradient = drawCtx.createLinearGradient(0, 250, 0, 0);
    gradient.addColorStop(0, "darkBlue");
    gradient.addColorStop(1, "white");
}

//creates the UI inside the initilization
function setupUI() {
    playButton = document.querySelector("#playButton");
    playButton.onclick = e => {
        //console.log(`audioCtx.state = ${audioCtx.state}`);

        // check if context is in suspended state (autoplay policy)
        if (audioCtx.state == "suspended") {
            audioCtx.resume();
        }

        if (e.target.dataset.playing == "no") {
            audioElement.play();
            e.target.dataset.playing = "yes";
            paused = false;
            // if track is playing pause it
        } else if (e.target.dataset.playing == "yes") {
            audioElement.pause();
            e.target.dataset.playing = "no";
            paused = true;
        }
    };



    //events to alter the behavior upon user input
    let volumeSlider = document.querySelector("#volumeSlider"); //increase/decrease volume using gain node upon use of slider
    volumeSlider.oninput = e => {
        gainNode.gain.value = e.target.value;
        volumeLabel.innerHTML = Math.round((e.target.value / 2 * 100));
    };
    volumeSlider.dispatchEvent(new InputEvent("input"));

    let windSlider = document.querySelector('#windSlider'); //adjust speed at which the clouds scroll across the screen
    windSlider.oninput = e => {
        cloudSpeed = e.target.value;
        windLabel.innerHTML = e.target.value;
    };
    windSlider.dispatchEvent(new InputEvent("input"));

    let delaySlider = document.querySelector('#delaySlider'); //creates a reverb effect of varying delay
    delaySlider.oninput = e => {
        delayAmount = e.target.value;
        delayLabel.innerHTML = e.target.value;
    };
    delaySlider.dispatchEvent(new InputEvent("input"));

    let compressionSlider = document.querySelector('#compressionSlider'); //adjusts compression dB threshold 
    compressionSlider.oninput = e => {
        threshVal = e.target.value;
        compressionLabel.innerHTML = e.target.value;
        compressorNode.threshold.setValueAtTime(threshVal, audioCtx.currentTime);
    };
    compressionSlider.dispatchEvent(new InputEvent("input"));


    document.querySelector("#trackSelect").onchange = e => { //select song to play
        audioElement.src = e.target.value;
        // pause the current track if it is playing
        playButton.dispatchEvent(new MouseEvent("click"));
    };


    // if track ends
    audioElement.onended = _ => {
        playButton.dataset.playing = "no";
    };

    document.querySelector("#fsButton").onclick = _ => { //fullscreens canvas
        app.utilities.requestFullscreen(canvasElement);
    };



    document.querySelector("#invert").onchange = function (e) { //swaps the invert flag
        invert = !invert;
    };

    document.querySelector("#tin").onchange = function (e) { //swaps tint flag
        tint = !tint;
    };
    document.querySelector("#noise").onchange = function (e) { //swaps noise flag
        noise = !noise;
    };

    document.querySelector("#sepia").onchange = function (e) { //swaps sepia flag
        sepia = !sepia;
    };

    document.querySelector("#freqButt").onclick = function (e) { //sets vizualizer to frequency
        frequency = true;
        waveform = false;
        both = false;
    };

    document.querySelector("#waveButt").onclick = function (e) { //sets vizualizer to waveform
        frequency = false;
        waveform = true;
        both = false;
    };

    document.querySelector("#bothButt").onclick = function (e) { //sets vizualizer to frequency and waveform
        frequency = false;
        waveform = false;
        both = true;
    };

}

//function that runs every frame to update information and behavior based on input from the user 
function update() {
    // this schedules a call to the update() method in 1/60 seconds
    requestAnimationFrame(update);

    peak = 0; //reset the peak every frame so that the highest peak currently is recorded not the highest peak ever
    audioData.forEach(function (element) { //gets the current data peak
        if (element > peak && !paused)
            peak = element;
        if (waveform)
            peak = 0;
    })

    if (rotation <= -0.1 || rotation >= 0.1) //changes rotation direction when it reaches its maxes
        direction *= -1;

    rotation = parseFloat(rotation) + (parseFloat(0.001) * direction); //rotates ship to simulate swaying from waves


    /*
        Nyquist Theorem
        http://whatis.techtarget.com/definition/Nyquist-Theorem
        The array of data we get back is 1/2 the size of the sample rate 
    */

    // populate the audioData with the frequency data
    // notice these arrays are passed "by reference" 
    analyserNode.getByteFrequencyData(audioData);

    // OR
    //analyserNode.getByteTimeDomainData(audioData); // waveform data

    //update delay time
    delayNode.delayTime.value = delayAmount;

    // DRAW!
    drawCtx.clearRect(0, 0, 800, 600);
    drawCtx.fillStyle = gradient;
    drawCtx.fillRect(0, 0, 800, 600);
    let barWidth = 39;
    let barSpacing = 1;
    let barHeight = 100;
    let topSpacing = 10;


    if (moveWave % 320 == 0) {
        waveDir = - waveDir;
    }
    moveWave = (moveWave + waveDir);

    //Back Clouds
    if (cloud1 > 45)
        cloud1 = 0;
    for (let i = 0; i < 16; i++) {
        drawCtx.strokeStyle = 'grey';
        drawCtx.fillStyle = 'grey';
        drawCtx.beginPath();
        drawCtx.arc((i * 45 - cloud1), 35, 40, 0, 2 * Math.PI);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }
    cloud1 = parseFloat(cloud1) + parseFloat(cloudSpeed);

    //Lightning
    analyserNode.getByteTimeDomainData(audioData); // waveform data
    for (let i = 0; i < audioData.length; i++) {

        // the higher the amplitude of the sample (bin) the taller the bar
        // remember we have to draw our bars left-to-right and top-down
        //drawCtx.fillRect(i * (barWidth + barSpacing), topSpacing + 256 - audioData[i], barWidth, barHeight);
        //drawCtx.arc(i * (barWidth + barSpacing), topSpacing + 256 - audioData[i], barWidth / 2, 0, Math.PI * 2, false);
        //drawCtx.fill();
        //drawCtx.closePath();

        drawCtx.lineWidth = 2;
        drawCtx.strokeStyle = 'rgba(255,255,0,1.0)';
        if ((!paused) && (waveform || both))
            for (let j = 0; j < 3; j++) {
                drawCtx.beginPath();
                drawCtx.moveTo((j * 200) + 256 - audioData[i], i * (barWidth + barSpacing));
                drawCtx.lineTo((j * 200) + 256 - audioData[i + 1], (i + 1) * (barWidth + barSpacing));
                drawCtx.stroke();
                drawCtx.closePath();

                drawCtx.beginPath();
                drawCtx.moveTo((j * 200) + 256 - audioData[i] - 50, 640 - i * (barWidth + barSpacing));
                drawCtx.lineTo((j * 200) + 256 - audioData[i + 1] - 50, 640 - (i + 1) * (barWidth + barSpacing));
                drawCtx.stroke();
                drawCtx.closePath();
            }
    }
    //Front Clouds
    if (cloud2 > 60)
        cloud2 = 0;
    for (let i = 0; i < 13; i++) {
        drawCtx.strokeStyle = 'LightGray';
        drawCtx.fillStyle = 'LightGray';
        drawCtx.beginPath();
        drawCtx.arc((i * 60) - cloud2, 5, 55, 0, 2 * Math.PI);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }
    cloud2 = parseFloat(cloud2) + parseFloat(cloudSpeed) + 0.1;


    //Top Waves
    analyserNode.getByteFrequencyData(audioData);
    for (let i = 0; i < audioData.length; i++) {

        if (frequency || both) {
            aData2 = audioData[audioData.length - i];
        }
        else {
            aData2 = 0;
        }

        drawCtx.lineWidth = 3;
        drawCtx.strokeStyle = 'rgba(0,0,255,1.0)';
        drawCtx.fillStyle = 'rgba(0,105,148,1.0)';
        drawCtx.beginPath();
        drawCtx.bezierCurveTo(i * (barWidth + barSpacing) + moveWave - 640, 400, i * (barWidth + barSpacing) + moveWave - 640, topSpacing + 256 - aData2, (i + 3) * (barWidth + barSpacing) + moveWave - 640, 400);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }
    for (let i = 0; i < audioData.length; i++) {

        if (frequency || both) {
            aData = audioData[i];
        }
        else {
            aData = 0;
        }

        drawCtx.lineWidth = 3;
        drawCtx.strokeStyle = 'rgba(0,0,255,1.0)';
        drawCtx.fillStyle = 'rgba(0,105,148,1.0)';
        drawCtx.beginPath();
        drawCtx.bezierCurveTo(i * (barWidth + barSpacing) + moveWave, 400, i * (barWidth + barSpacing) + moveWave, topSpacing + 256 - aData, (i + 3) * (barWidth + barSpacing) + moveWave, 400);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }

    app.utilities.drawBoat(drawCtx,peak,rotation);

    //Bottom Waves
    for (let i = 0; i < audioData.length; i++) {

        if (frequency || both) {
            aData = audioData[i];
        }
        else {
            aData = 0;
        }
        //Bottom waves
        drawCtx.strokeStyle = 'rgba(0,0,255,1.0)';
        drawCtx.fillStyle = 'rgba(0,155,148,1.0)';

        drawCtx.beginPath();
        drawCtx.bezierCurveTo(i * (barWidth + barSpacing) - moveWave, 400, i * (barWidth + barSpacing) - moveWave, topSpacing + 256 - aData + 75, (i + 3) * (barWidth + barSpacing) - moveWave, 400);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }
    for (let i = 0; i < audioData.length; i++) {
        if (frequency || both) {
            aData2 = audioData[audioData.length - i];
        }
        else {
            aData2 = 0;
        }
        drawCtx.beginPath();
        drawCtx.bezierCurveTo(i * (barWidth + barSpacing) - moveWave + 560, 400, i * (barWidth + barSpacing) - moveWave + 560, topSpacing + 256 - aData2 + 75, (i + 3) * (barWidth + barSpacing) - moveWave + 560, 400);
        drawCtx.stroke();
        drawCtx.fill();
        drawCtx.closePath();
    }


    //audio progress bar update
    bar = document.querySelector("#seekbar");
    bar.value = audioElement.currentTime;
    let maxFloat = (audioElement.duration).toFixed(2); //curtails to 2 decimal places
    //console.log(maxFloat);
    if (maxFloat != NaN && isFinite(maxFloat)) //ensures that the maximum of progress bar is a finite number
        bar.max = maxFloat;

    app.utilities.manipulatePixels(drawCtx,tint,invert,noise,sepia);
}

return{
    init
};

})();
