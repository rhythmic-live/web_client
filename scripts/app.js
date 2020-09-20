/* global Vue, opensheetmusicdisplay, load_new_xml, playSong, stopSong, Tone, io, getInstruments */

// osmd
var osmd;

// socket comms
const SOCKET_ADDR = 'http://ed.ward.li:8081';
var socket;

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
          playSong(null, false, this.startMeasure, this.endMeasure);
          socket.emit('start');
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
    isCurrentlyRecording: 0,
    recordBtnText: 'Start Recording',
    mxlFile: '',
    mxlPath: '',
    startMeasure: 0,
    endMeasure: 1,
    performanceTempo: 0,
    mxlLoaded: false,
    focusInstrument: '',
    instruments: [],
    recordingStats: [
      {date: new Date(), analysis: [0.3, 0.1, 0.65, 1]}
    ],
  },
  methods: {
    promptMxl: function(e) {
      // document.getElementById('userFilePrompter').click();
      socket.on('xml_return', function(xml) {
        console.log(xml);
        load_new_xml(xml, function() {
          this.endMeasure = osmd.sheet.LastMeasureNumber + 1;
          this.performanceTempo = osmd.sheet.defaultStartTempoInBpm;
          this.mxlLoaded = true;
          this.instruments = getInstruments();
        }.bind(this));
      }.bind(this));

      socket.on('start-participants', function(e) {
        this.broadcastRecording();
      }.bind(this));

      socket.on('analytics', function (e) {
        this.recordingStats.push({
          date: new Date(),
          analysis: e
        });
      }.bind(this));
    },
    broadcastRecording: function(e) {
      if (!this.mxlLoaded) return;
      if (this.isCurrentlyRecording < 2) {
        // TODO: broadcast recording started message
        this.isCurrentlyRecording = 1;
        Tone.start().then(function() {
          this.recordBtnText = 'Stop Recording';
          this.isCurrentlyRecording++;
          let focusInstruments = [];
          if (this.focusInstrument.length == 0)
            focusInstruments = null;
          else
            focusInstruments = [this.focusInstrument];

          playSong(focusInstruments, false, this.startMeasure, this.endMeasure);
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

})();
