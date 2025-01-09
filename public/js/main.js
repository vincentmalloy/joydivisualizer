const jsmediatags = window.jsmediatags;
const average = array => array.reduce((a, b) => a + b) / array.length;
const isOverflown = (element) => {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}
const MAX_SOUND_VALUE = 256;

const SETTINGS = {
    colors: {
        background: '#111111',
        line: '#fafafa',
    },
    style: {
        lineWidth: 1.75
    },
    visualizer: {
        numberOfLines: 81, // total number of horizontal lines in the graph
        lineMaxFactor: 25, //increase this to raise the max amplitude
        lineWiggle: 5, // factor to make the lines look handwritten (1-10 seems reasonable)
        reverse: false, // reverse the frequency direction vertically
        normalize: false // try to make the graph more uniform vertically
    },
    audio: {
        fftSize: 2 ** 14, // must be a power of 2 between 2^5 and 2^15
        range: 0.39 // lower fraction of the freq spectrum to be visualized, there is usually nothing in the upper 50%
    }
}

let context;
let sound;
let analyser;
let soundDataArray;
let offsets = [];

let audioRangeSize = Math.floor(SETTINGS.audio.range * SETTINGS.audio.fftSize);

// document.body.style.backgroundColor = settings.colors.background.toString(16).substring(2);
document.addEventListener('click', function firstClick(e) {
    context = new (window.AudioContext || window.webkitAudioContext)();
    analyser = context.createAnalyser();
    // remove event handler
    this.removeEventListener('click', firstClick);
})
function resizeTags() {
    let tagElements = document.getElementsByClassName('tag');
    for (let i = 0; i < tagElements.length; i++) {
        let tagElement = tagElements[i];
        let max = tagElement.dataset.max;
        let fontSize = tagElement.style.fontSize;
        if (fontSize != "" && tagElement.innerHTML != "" && tagElement.hasChildNodes()) {
            let getMeOutOfHere = 0;
            if(isOverflown(tagElement)){
                while (isOverflown(tagElement)) {
                    fontSize = parseInt(fontSize) - 1;
                    tagElement.style.fontSize = fontSize + 'px';
                    if(getMeOutOfHere>100){
                        break;
                    }
                    getMeOutOfHere++;
                }
            }else{
                while (!isOverflown(tagElement)) {
                    fontSize = parseInt(fontSize) + 1;
                    tagElement.style.fontSize = fontSize + 'px';
                    if(getMeOutOfHere>100){
                        break;
                    }
                    getMeOutOfHere++;
                }
            }
            fontSize -= 8;
            if(max!==undefined){
                if(fontSize > max){
                    fontSize = max;
                }
            }
            tagElement.style.fontSize = fontSize + 'px';
        }

    }
}
const updateTags = (tags) => {
    let artistElement = this.document.getElementById('artist');
    artistElement.classList.add("tag");
    let titleElement = this.document.getElementById('title');
    titleElement.classList.add("tag");
    let albumElement = this.document.getElementById('album');
    albumElement.classList.add("tag");
    let artist = tags.artist.toUpperCase();
    let title = tags.title.toUpperCase();
    let album = tags.album.toUpperCase();
    var boldLetters = artist.split("");
    artistElement.innerHTML = "";
    for (let i = 0; i < boldLetters.length; i++) {
        let letterElement = document.createElement('div');
        letterElement.innerHTML = boldLetters[i];
        letterElement.classList.add("bold");
        artistElement.appendChild(letterElement);
    }
    titleElement.innerHTML = "";
    let titleLetters = title.split("");
    // titleLetters=titleLetters.replace(" ", "&nbsp;");
    for (let i = 0; i < titleLetters.length; i++) {
        let letterElement = document.createElement('div');
        letterElement.innerHTML = titleLetters[i];
        titleElement.appendChild(letterElement);
    }
    albumElement.innerHTML = "";
    let albumNoParentheses = album.split("(")[0];
    let albumLetters = albumNoParentheses.split("");
    for (let i = 0; i < albumLetters.length; i++) {
        let letterElement = document.createElement('div');
        letterElement.innerHTML = albumLetters[i];
        albumElement.appendChild(letterElement);
    }
    resizeTags();
}
function play(sound) {
    sound.play();
    let playElement=document.getElementById("play");
    playElement.classList.add("hidden");
    let pauseElement=document.getElementById("pause");
    pauseElement.classList.remove("hidden");
}
function pause(sound) {
    sound.pause();
    let playElement=document.getElementById("play");
    playElement.classList.remove("hidden");
    let pauseElement=document.getElementById("pause");
    pauseElement.classList.add("hidden");
}
function stop(sound) {
    sound.pause();
    sound.currentTime = 0;
    let playElement=document.getElementById("play");
    playElement.classList.remove("hidden");
    let pauseElement=document.getElementById("pause");
    pauseElement.classList.add("hidden");
}
function toggleMute(sound) {
    let muteElement = document.getElementById("mute");
    let unmuteElement = document.getElementById("unmute");
    if (sound.muted) {
        sound.muted = false;
        unmuteElement.classList.add("hidden");
        muteElement.classList.remove("hidden");
    } else {
        sound.muted = true;
        muteElement.classList.add("hidden");
        unmuteElement.classList.remove("hidden");
    }
}
function initPlayer(file){
    //read mp3 tags
    jsmediatags.read(file, {
        onSuccess: function (tag) {
            var tags = tag.tags;
            // alert(tags.artist + " - " + tags.title + ", " + tags.album);
            updateTags(tags);
        }
    });
    
};
function playAudio(src){
        sound.src = src;                       //Setting the source for the sound element.
        sound.controls = false;                         //User can pause and play audio.
        sound.play();                                  //Start playing the tunes!
        let soundcontrolElement = document.getElementById("soundcontrol");
        soundcontrolElement.classList.remove("hidden");
        let playElement=document.getElementById("play");
        playElement.onclick=function(){
            play(sound);
        }
        let pauseElement=document.getElementById("pause");
        pauseElement.onclick=function(){
            pause(sound);
        }
        let stopElement=document.getElementById("stop");
        stopElement.onclick=function(){
            stop(sound);
        }
        let muteElement=document.getElementById("mute");
        let unmuteElement=document.getElementById("unmute");
        muteElement.onclick=function(){
            toggleMute(sound);
        }
        unmuteElement.onclick=function(){
            toggleMute(sound);
        }
        let refreshElement=document.getElementById("refresh");
        refreshElement.onclick=function(){
            location.reload();
        }
        let progressBarElement = document.getElementById("progress-bar");
        progressBarElement.classList.add("active");
        progressBarElement.onclick = function (e) {
            let progress = e.offsetX / progressBarElement.clientWidth;
            sound.currentTime = sound.duration * progress;
            updateProgress();
        }
    
}

function updateProgress() {
    let progressElement = document.getElementById("progress-played");
    let progress = sound.currentTime / sound.duration;
    progressElement.style.width = progress * 100 + "%";
}
audioInput.onchange = function () {
    let inputLabel = document.getElementById("audioInputLabel");
    inputLabel.classList.add("hidden");
    sound = document.getElementById("sound");    //What element we want to play the audio.
    let reader = new FileReader();                   //How we load the file.
    reader.onload = function (e) {                    //What we do when we load a file.
        playAudio(this.result);
    };
    initPlayer(this.files[0]);
    reader.readAsDataURL(this.files[0]);             //This will call the reader.onload function when it finishes loading the file.
    createAudioObjects();
};

//Connects the audio source to the analyser and creating a suitably sized array to hold the frequency data.
function createAudioObjects() {
    let source = context.createMediaElementSource(document.getElementById("sound"));
    source.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = SETTINGS.audio.fftSize;
    soundDataArray = new Uint8Array(analyser.frequencyBinCount);
}

async function getFile(url){
    try {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    let data = await response.blob;
    let fileName = url.split('/').pop();
    let metadata = {
        type: "audio/mpeg"
    };
    return new File([data], fileName, metadata);
    ;
  } catch (error) {
    console.error(error.message);
  }
}
async function handleDemo(fileUrl) {
  const file = await getFile(fileUrl);
  const input = document.querySelector('input[type="file"]');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  const event = new Event("change", {
    bubbles: !0,
  });
  input.dispatchEvent(event);
}
function init() {
    document.getElementById("credits").onclick = async function () {
        console.log("click")
        const searchParams = new URLSearchParams(window.location.search);
        if(searchParams.has("demo")){
            let demo = searchParams.get("demo");
            let fileUrl="";
            if(demo === "interpol"){
                fileUrl = "demo/01.mp3";
            }else if(demo === "control"){A
                fileUrl = "demo/02.url";
            }
            if(fileUrl){
                handleDemo(fileUrl)
                let file = await getFile(fileUrl);
                initPlayer(file);
            }
        }else{
            console.log(searchParams.get("demo"));
        }
    };
    let wrap = document.getElementById('wrap');
    let wiggleData = new Array(audioRangeSize).fill(0);
    const getWiggle = (oldWiggle) => {
        let wiggle = Math.random() * MAX_SOUND_VALUE * SETTINGS.visualizer.lineWiggle * (.1 ** 4) * SETTINGS.visualizer.lineMaxFactor;
        if (Math.random() > 0.5) {
            wiggle *= -1;
        }
        // interpolate between old and new wiggle
        let weight = 10
        wiggle = (wiggle + (oldWiggle * weight)) / (weight + 1);
        return wiggle;
    }

    const updateWiggle = () => {
        for (let i = 0; i < wiggleData.length; i++) {
            wiggleData[i] = getWiggle(wiggleData[i]);
        };
    }
    const shiftWiggle = () => {
        wiggleData.shift();
        wiggleData.push(getWiggle(wiggleData[wiggleData.length - 1]));
    }
    updateWiggle();

    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    function resizeCanvas() {
        canvas.width = canvas.clientHeight * (2 / 3);
        wrap.style.width = canvas.width + 'px';
        canvas.height = canvas.clientHeight;
    }

    resizeCanvas();
    function resize() {
        resizeCanvas();
        resizeTags();
    }
    window.addEventListener('resize', resize, false);
    let numberOfLines = SETTINGS.visualizer.numberOfLines;
    let lineOffset = SETTINGS.visualizer.lineOffset;
    let lineMaxFactor = SETTINGS.visualizer.lineMaxFactor;
    const getVerticalOffset = (line) => {
        return (canvas.height / (numberOfLines + lineMaxFactor)) * line;
    }
    const lineUnit = canvas.height / (numberOfLines + lineMaxFactor);
    const getSliceWidth = () => {
        let sliceWidth = canvas.width / (audioRangeSize / SETTINGS.visualizer.numberOfLines);
        return sliceWidth;
    }
    // returns a value between 0 and 1
    const getLineAmplitude = (x, amplitude = 0) => {
        amplitude = amplitude / MAX_SOUND_VALUE;
        const sectors = {
            low: {
                lower: [0, canvas.width / 10],
                upper: [(canvas.width / 10) * 9, canvas.width]
            },
            rising: {
                lower: [canvas.width / 10, (canvas.width / 6) * 2],
                upper: [(canvas.width / 6) * 4, (canvas.width / 10) * 9]
            },
            full: [(canvas.width / 6) * 2, (canvas.width / 6) * 4],
        }
        let factor;
        if (x < Math.ceil(sectors.low.lower[1]) || x >= Math.floor(sectors.low.upper[0])) {
            factor = 0;
        } else if (x < Math.ceil(sectors.rising.lower[1]) && x >= Math.floor(sectors.rising.lower[0])) {
            //calculate distance from sector bounds
            let distance = Math.abs(x - Math.ceil(sectors.rising.lower[1]));
            factor = 1 - (distance / (sectors.rising.lower[1] - sectors.rising.lower[0]));
        } else if (x <= Math.ceil(sectors.rising.upper[1]) && x > Math.floor(sectors.rising.upper[0])) {
            let distance = Math.abs(x - Math.floor(sectors.rising.upper[0]));
            factor = 1 - (distance / (sectors.rising.upper[1] - sectors.rising.upper[0]));
        } else if (x > Math.floor(sectors.full[0]) && x <= Math.ceil(sectors.full[1])) {
            factor = 1;
        }
        factor = factor ** 2;
        // factor+=.1;
        // if(factor>1){
        //     factor =1;
        // }
        return amplitude * factor;
    }
    const drawLine = (line, data = new Array(audioRangeSize)) => {
        function getX(i) {
            let x = i * getSliceWidth();
            return x;
        }
        let normalize = 1;
        if (SETTINGS.visualizer.normalize) {
            let lineDistanceFromTop = (line - lineMaxFactor) / numberOfLines;
            normalize = (lineDistanceFromTop + 1) / 2;
        }
        function getY(i) {
            let amp = getLineAmplitude(i * getSliceWidth(), data[i]);
            let index = i + ((line - lineMaxFactor) * Math.floor((audioRangeSize / SETTINGS.visualizer.numberOfLines)));
            let y = getVerticalOffset(line) - ((amp * lineUnit * lineMaxFactor * normalize)) - wiggleData[index];
            return y;
        }
        let Path = new Path2D();
        let outside = data.length;
        Path.moveTo(-outside, canvas.height + outside);
        Path.lineTo(-outside, canvas.height / 2);
        Path.lineTo(0, getVerticalOffset(line)); // move to y start
        for (let i = 0; i < data.length; i++) {
            let x = getX(i);
            let y = getY(i);
            Path.lineTo(x, y);
        }
        Path.lineTo(canvas.width + outside, getVerticalOffset(line));
        Path.lineTo(canvas.width + outside, canvas.height + outside);
        Path.closePath();
        context.fillStyle = SETTINGS.colors.background;
        context.strokeStyle = SETTINGS.colors.line;
        context.lineWidth = SETTINGS.style.lineWidth;
        context.fill(Path);
        context.stroke(Path);
    }
    const drawCanvas = (data = []) => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = SETTINGS.colors.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let line = lineMaxFactor; line < numberOfLines + lineMaxFactor; line++) {
            drawLine(line, data[line - lineMaxFactor]);
        }
        // draw 2px border around canvas
        context.strokeStyle = SETTINGS.colors.background;
        context.lineWidth = 2;
        context.strokeRect(0, 0, canvas.width, canvas.height);
    }
    // init canvas
    // drawCanvas();
    context.clearRect(0, 0, canvas.width, canvas.height);
    let shift = 0;
    const animate = () => {
        window.requestAnimationFrame(animate);
        updateWiggle();
        if (shift === 4) {
            shift = 0;
            shiftWiggle();
        } else {
            shift++;
        }
        if ((soundDataArray === undefined) == false) {
            analyser.getByteFrequencyData(soundDataArray);
            let dataArray = [];
            for (let line = 0; line < numberOfLines; line++) {
                dataArray.push(soundDataArray.slice(line * (audioRangeSize / SETTINGS.visualizer.numberOfLines), (line + 1) * (audioRangeSize / SETTINGS.visualizer.numberOfLines)));
            }
            if (SETTINGS.visualizer.reverse) {
                dataArray.reverse();
                for (let i = 0; i < dataArray.length; i++) {
                    dataArray[i].reverse();
                }
            }
            updateProgress();
            drawCanvas(dataArray);
        } else {
            // drawCanvas();
        }
    }

    animate();

}
init();
