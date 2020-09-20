/* global Vue, opensheetmusicdisplay, load_new_xml, playSong, stopSong, Tone */

// osmd
var osmd;

// vue code
var app = new Vue({
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
        }.bind(this));
      }.bind(this);
    
      // read the file
      reader.readAsText(file, 'UTF-8');
    },
    broadcastRecording: function(e) {
      if (this.isCurrentlyRecording < 2) {
        // TODO: broadcast recording started message
        this.isCurrentlyRecording = 1;
        Tone.start().then(function() {
          playSong(null, false, this.startMeasure, this.endMeasure);
          this.recordBtnText = "Stop Recording";
          this.isCurrentlyRecording++;
        });
      } else if (this.isCurrentlyRecording >= 2) {
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
  if (showConductorAfter)
    document.getElementById('conductor').classList.remove('actuallyHidden');
  else
    document.getElementById('participant').classList.remove('actuallyHidden');
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
  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("conductor-sheet-music");
  osmd.setOptions({
      backend: "svg",
      followCursor: true
  });

};

let showParticipant = function() {
  document.getElementById('landing').classList.add('actuallyHidden');
  document.getElementById('participant').classList.add('showing');
  osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("participant-sheet-music");
  osmd.setOptions({
      backend: "svg",
      followCursor: true
  });
};


(function() {
  var sessionCode = document.getElementById('session-code');
  var createBtn = document.getElementById('btn-create');
  var joinBtn = document.getElementById('btn-join');
  var inputSesscode = document.getElementById('input-sesscode');
  var isFirstJoin = true;

  // TODO: debug code; delete when done
  sessionCode.innerHTML = 'Session code: <code>TSLACALLS</code>';
  hideLanding(true);

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
    app.loadMxl(fn);
  });

})();
