/* global Vue, opensheetmusicdisplay, load_new_xml, playSong, stopSong, Tone, io, getInstruments */

// osmd
var osmd;

// socket comms
const SOCKET_ADDR = 'https://api.rhythmic.live';
var socket;

mediaConstraint = {
	video: false,
	audio: {
		sampleRate: 44100,
		channelCount: 1
	}
};

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);


function startRecord(name) {
  console.log('recording started');
    let blob_no = 0;
	navigator.getUserMedia(mediaConstraint, function(stream) {
		audioRecorder = new MediaStreamRecorder(stream);
		audioRecorder.mimeType = 'audio/pcm';
		//audioRecorder.sampleRate = 22050;
		audioRecorder.audioChannels = 1;
		audioRecorder.ondataavailable = function(e) {
            socket.emit("audio-tx", [e, blob_no, name]);
            blob_no++;
		}
		audioRecorder.start(100);
	}, function(error){
        console.log("Error in stream")
	});
}

// vue code
let primaryApp = null;
var appConductor = new Vue({
  el: '#conductor-controls',
  data: {
    isCurrentlyRecording: 0,
    recordBtnText: 'Start Recording',
    mxlFile: '',
    mxlPath: '',
    startMeasure: 0,
    endMeasure: 1,
    performanceTempo: 0,
    mxlLoaded: false,
    recordingStats: [],
  },
  methods: {
    promptMxl: function(e) {
      document.getElementById('userFilePrompter').click();
    },
    loadMxl: function(file) {
      this.mxlFile = file;
      this.mxlPath = file.name;

      var reader = new FileReader();

      // here we tell the reader what to do when it's done reading...
      reader.onload = function(readerEvent) {
        var content = readerEvent.target.result; // this is the content!
        load_new_xml(content, function() {
          this.endMeasure = osmd.sheet.LastMeasureNumber + 1;
          this.performanceTempo = osmd.sheet.defaultStartTempoInBpm;
          this.mxlLoaded = true;
          socket.emit('update_xml', [content, file.name]);
        }.bind(this));
      }.bind(this);

      // read the file
      reader.readAsText(file, 'UTF-8');
    },
    broadcastRecording: function(e) {
      if (!this.mxlLoaded) return;
      if (this.isCurrentlyRecording < 2) {
        // TODO: broadcast recording started message
        this.isCurrentlyRecording = 1;
        Tone.start().then(function() {
          this.recordBtnText = 'Stop Recording';
          this.isCurrentlyRecording++;
          playSong(null, false, this.startMeasure, this.endMeasure, function() {
            // on start
            socket.emit('start', [this.startMeasure, this.endMeasure, this.performanceTempo]);
          }.bind(this), function() {
            // on end
            this.broadcastRecording(null);
            socket.emit('stop');
          }.bind(this));
        }.bind(this));
      } else if (this.isCurrentlyRecording >= 2) {
        this.recordBtnText = 'Start Recording';
        this.isCurrentlyRecording = 0;
        stopSong();
      }
    },
    updateBpm: function(e) {
      osmd.sheet.defaultStartTempoInBpm = this.performanceTempo;
    }
  }
});

var appParticipant = new Vue({
  el: '#participant-controls',
  data: {
    isReadyToRecord: 0,
    recordBtnText: 'Ready to Record',
    mxlFile: '',
    mxlPath: '',
    startMeasure: 0,
    endMeasure: 1,
    performanceTempo: 0,
    mxlLoaded: false,
    focusInstrument: '',
    instruments: [],
    recordingStats: [
    ],
    countdown: 0
  },
  methods: {
    promptMxl: function(e) {
      // document.getElementById('userFilePrompter').click();
      socket.on('xml_return', function(xml) {
        load_new_xml(xml, function() {
          this.endMeasure = osmd.sheet.LastMeasureNumber + 1;
          this.performanceTempo = osmd.sheet.defaultStartTempoInBpm;
          this.mxlLoaded = true;
          this.instruments = getInstruments();
        }.bind(this));
      }.bind(this));

      socket.on('start-participants', function(data) {
        this.startMeasure = data[0];
        this.endMeasure = data[1];
        this.performanceTempo = data[2];
        this.countdown = 3;
        let interval = setInterval(function() {
          this.countdown--;
          if (this.countdown == 0) {
            clearInterval(interval);
            this.startRecording();
          }
        }.bind(this), 1000);
      }.bind(this));

      socket.on('analytics', function (e) {
        this.recordingStats.push({
          date: new Date(),
          analysis: e[0][1]
        });
      }.bind(this));
    },
    startRecording: function(e) {
      if (this.isReadyToRecord == 0) {
        this.isReadyToRecord += 1;
        this.recordBtnText = 'Waiting for conductor...';
      } else {
        Tone.start().then(function() {
          this.recordBtnText = 'Recording...';
          this.isCurrentlyRecording++;

          let focusInstruments = [];
          if (this.focusInstrument.length == 0)
            focusInstruments = null;
          else
            focusInstruments = [this.focusInstrument];

          playSong(focusInstruments, false, this.startMeasure, this.endMeasure, function() {startRecord(this.focusInstrument);}.bind(this), function() {this.isReadyToRecord = 1; this.recordBtnText = 'Waiting for conductor...'; audioRecorder.stop();}.bind(this));
          this.isReadyToRecord = true;
        }.bind(this));
      }
    },
    updateBpm: function(e) {
      osmd.sheet.defaultStartTempoInBpm = this.performanceTempo;
    }
  }
});



// native
let hideLanding = function(showConductorAfter) {
  var landing = document.getElementById('landing');
  var logoBar = document.getElementById('logo-bar');

  // connect to socket
  socket = io.connect(SOCKET_ADDR);

  // update visibility of stuff
  if (showConductorAfter) {
    document.getElementById('conductor').classList.remove('actuallyHidden');
    primaryApp = appConductor;
  } else {
    document.getElementById('participant').classList.remove('actuallyHidden');
    primaryApp = appParticipant;
  }
  landing.classList.add('hidden');
  logoBar.classList.add('logo-topleft');
  logoBar.addEventListener('click', function() {
    window.location.reload(false);
  });
  setTimeout(function() {
    if (showConductorAfter) showConductor();
    else showParticipant();
  }, 300);
};

let showConductor = function() {
  document.getElementById('landing').classList.add('actuallyHidden');
  document.getElementById('conductor').classList.add('showing');
  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay('conductor-sheet-music');
  osmd.setOptions({
    backend: 'svg',
    followCursor: true
  });
};

let showParticipant = function() {
  document.getElementById('landing').classList.add('actuallyHidden');
  document.getElementById('participant').classList.add('showing');
  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay('participant-sheet-music');
  osmd.setOptions({
      backend: 'svg',
      followCursor: true
  });
  // fetch and load the music
  primaryApp.promptMxl();

  socket.emit('get_xml', '');
};


(function() {
  var sessionCode = document.getElementById('session-code');
  var createBtn = document.getElementById('btn-create');
  var joinBtn = document.getElementById('btn-join');
  var inputSesscode = document.getElementById('input-sesscode');
  var isFirstJoin = true;

  // TODO: debug code; delete when done
  //sessionCode.innerHTML = 'Session code: <code>TSLACALLS</code>';
  //hideLanding(true);

  // create button
  createBtn.addEventListener('click', function() {
    sessionCode.innerHTML = 'Session code: <code>TSLACALLS</code>';
    // create session
    hideLanding(true);
  });

  // join button
  joinBtn.addEventListener('click', function() {
    if (isFirstJoin) {
      isFirstJoin = false;
      joinBtn.classList.add('landing-btn-collapsed');
      joinBtn.innerHTML = '&#10132;';
      inputSesscode.classList.remove('input-hidden');
      inputSesscode.classList.add('input-expanded');
      setTimeout(function() {
        inputSesscode.focus();
      }, 100);
    } else {
      // actually join session
      sessionCode.innerHTML = 'Session code: <code>' + inputSesscode.value + '</code>';
      hideLanding(false);
    }
  });

  // user file prompter
  document.getElementById('userFilePrompter').addEventListener('input', function(evt) {
    let fn = evt.target.files[0];
    primaryApp.loadMxl(fn);
  });

  navigator.getUserMedia({audio: true}, function(status) {
    console.log(status);
  }, () => console.log("error!"));

})();
