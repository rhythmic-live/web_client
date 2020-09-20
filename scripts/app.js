let hideLanding = function(showConductorAfter) {
  var landing = document.getElementById('landing');
  var logoBar = document.getElementById('logo-bar');
  document.getElementById('conductor').classList.remove('actuallyHidden');
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
};

let showParticipant = function() {
  document.getElementById('landing').classList.add('actuallyHidden');
  document.getElementById('participant').classList.add('showing');
};


(function() {
  var createBtn = document.getElementById('btn-create');
  var joinBtn = document.getElementById('btn-join');
  var inputSesscode = document.getElementById('input-sesscode');
  // TODO: made this false while debugging; should be true
  var isFirstJoin = true;

  createBtn.addEventListener('click', function() {
    // create session
    hideLanding(true);
  });

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
      hideLanding(false);
    }
  });
})();
