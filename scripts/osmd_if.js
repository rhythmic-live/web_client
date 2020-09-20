var loop = null;

var sampler = new Tone.Sampler({
    urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3"
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

var quietSampler = new Tone.Sampler({
    urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3"
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

quietSampler.volume.value = -15;

var MIDI_NUM_NAMES = ["C_1", "C#_1", "D_1", "D#_1", "E_1", "F_1", "F#_1", "G_1", "G#_1", "A_1", "A#_1", "B_1",
                "C0", "C#0", "D0", "D#0", "E0", "F0", "F#0", "G0", "G#0", "A0", "A#0", "B0",
                "C1", "C#1", "D1", "D#1", "E1", "F1", "F#1", "G1", "G#1", "A1", "A#1", "B1",
                "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
                "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
                "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
                "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
                "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
                "C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7", "A7", "A#7", "B7",
                "C8", "C#8", "D8", "D#8", "E8", "F8", "F#8", "G8", "G#8", "A8", "A#8", "B8",
                "C9", "C#9", "D9", "D#9", "E9", "F9", "F#9", "G9"];

sampler.sync()
quietSampler.sync()

function getNotes(start, end, emphasizedVoice=null) {
    var quietNotes = [];
    var loudNotes = [];
    moveToMeasure(start);
    const iterator = osmd.cursor.Iterator;

    while(iterator.currentMeasureIndex < end){
        const voices = iterator.CurrentVoiceEntries;
        if (voices == undefined) break;
        for(var i = 0; i < voices.length; i++){
            const v = voices[i];
            const name = v.parentVoice.parent.nameLabel.text;
            const loud = emphasizedVoice == null ? true : (emphasizedVoice.indexOf(name) >= 0)
            const notes = v.Notes;
            for(var j = 0; j < notes.length; j++){
                const note = notes[j];
                // make sure our note is not silent
                if((note != null) && (note.halfTone != 0)){
                    if (loud) {
                        loudNotes.push({
                            "note": MIDI_NUM_NAMES[note.halfTone+12],
                            "time": iterator.currentTimeStamp.RealValue * 4,
                            "duration": note.length.RealValue * 4
                        });
                    } else {
                        quietNotes.push({
                            "note": MIDI_NUM_NAMES[note.halfTone+12],
                            "time": iterator.currentTimeStamp.RealValue * 4,
                            "duration": note.length.RealValue * 4
                        });
                    }
                }
            }
        }
        osmd.cursor.next();
    }

    return [quietNotes, loudNotes];
}

function getCursorDuration() {
    duration = 100;

    const voices = osmd.cursor.iterator.CurrentVoiceEntries;
    for (var i = 0; i < voices.length; i++) {
        const v = voices[i];
        const notes = v.Notes;
        for(var j = 0; j < notes.length; j++){
            const note = notes[j];
            // make sure our note is not silent
            if((note != null)){
                duration = note.length.RealValue < duration ? note.length.RealValue : duration;
            }
        }
    }

    return duration;
}

function getStartingNote(start, voice) {
    moveToMeasure(start);
    const iterator = osmd.cursor.Iterator;

    while (iterator.currentMeasureIndex < osmd.sheet.LastMeasureNumber+1) {
        console.log(voices);
        const voices = iterator.CurrentVoiceEntries;
        for (var i = 0; i < voices.length; i++) {
            const v = voices[i];
            const name = v.parentVoice.parent.nameLabel.text;

            if (name != voice) {
                continue
            }

            const notes = v.Notes;
            if (notes.length > 0) {
                if ((notes[0] == null) || (notes[0].halfTone == 0)) {
                    continue
                }
                return MIDI_NUM_NAMES[notes[0].halfTone + 12];
            }
        }
        osmd.cursor.next();
    }
    return null;
}

function stopSong() {
    osmd.cursor.hide();
    sampler.releaseAll();
    quietSampler.releaseAll();
    Tone.Transport.cancel();
    Tone.Transport.stop();
    if (loop != null) loop.dispose();
}

function playSong(emphasizedVoice=null, onlyEmphasized=false, start=0, end=osmd.sheet.LastMeasureNumber+1, startCallback=null, endCallback=null, countIn=false) {
    stopSong();
    console.log(emphasizedVoice, onlyEmphasized);
    allNotes = getNotes(start, end, emphasizedVoice);
    console.log(allNotes);
    quietNotes = allNotes[0];
    loudNotes = allNotes[1];
    bpm = osmd.sheet.defaultStartTempoInBpm;

    time = Tone.now();

    max_time = 0;
    min_time = 100000000;

    for (var i = 0; i < quietNotes.length; i++) {
        if (quietNotes[i].time < min_time) min_time = quietNotes[i].time;
    }

    for (var i = 0; i < loudNotes.length; i++) {
        if (loudNotes[i].time < min_time) min_time = loudNotes[i].time;
    }

    if (startCallback != null) startCallback();
    
    if (!onlyEmphasized) {
        for (var i = 0; i < quietNotes.length; i++) {
            end_time = (quietNotes[i].duration + quietNotes[i].time) * (60/bpm);
            max_time = end_time > max_time ? end_time : max_time;
            quietSampler.triggerAttackRelease([quietNotes[i].note], quietNotes[i].duration * (60/bpm), (quietNotes[i].time-min_time) * (60/bpm));
        }
    }

    for (var i = 0; i < loudNotes.length; i++) {
        end_time = (loudNotes[i].duration + loudNotes[i].time) * (60/bpm);
        max_time = end_time > max_time ? end_time : max_time;
        sampler.triggerAttackRelease([loudNotes[i].note], loudNotes[i].duration * (60/bpm), (loudNotes[i].time-min_time) * (60/bpm));
    }

    osmd.cursor.show();
    moveToMeasure(start);
    start_time = Tone.now();

    loop = new Tone.Loop((timen) => {
        time = timen - start_time;
        while (osmd.cursor.iterator.currentTimeStamp.realValue+getCursorDuration() < (((time / (60/bpm))+min_time) / 4)) osmd.cursor.next();
    }, "16hz").start(0);

    Tone.Transport.scheduleOnce((time) => {
        osmd.cursor.hide();
        Tone.Transport.cancel();
        Tone.Transport.stop();
        loop.dispose();
        if (encCallback != null) endCallback();
    }, max_time-(min_time * (60/bpm)));

    Tone.Transport.start();
}

function getInstruments() {
    return osmd.sheet.instruments.map(inst => inst.nameLabel.text);
}

function moveToMeasure(measure) {
    if (measure > osmd.sheet.LastMeasureNumber) return;

    osmd.cursor.reset();
    while (osmd.cursor.iterator.currentMeasureIndex < measure) osmd.cursor.next();
}

function load_new_xml(xml_src, callback) {
    osmd.load(xml_src).then(
    function() {
        osmd.Zoom = 0.75;
        osmd.render();
        if (callback) {
            callback();
        }
    }
  );
}