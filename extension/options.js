// Helpers to store and access objects in local storage.
Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
  var value = this.getItem(key);
  if (value == null) {
    return null;
  } else {
    return JSON.parse(value);
  }
}

// Set the active option in the <select> named select_name to choice.
function setSelection(select_name, choice) {
  var select = document.getElementById(select_name);
  for (var i in select.children) {
    var child = select.children[i];
    if (child.value == choice) {
      child.selected = 'true';
      break;
    }
  }
}

selects    = ['clickModifier', 'shortcutModifier', 'shortcutKey'];
checkboxes = ['shortcutEnable', 'shortcutSelection', 'hideWithEscape',
              'saveFrameSize', 'showExamples', 'showPOS', 'showLabels',
              'showIPA', 'showAudio', 'showAudioLinks', 'showRelated',
              'showSynonyms', 'showAntonyms', 'showLinks', 'showEtymology'];
textboxes  = ['frameWidth', 'frameHeight', 'queryFormWidth'];

// Restores state from localStorage.
function restoreOptions() {
  // Set defaults.
  setSelection('clickModifier', 'Alt');
  setSelection('shortcutModifier', 'Ctrl');
  setSelection('shortcutKey', 'Q');
  document.getElementById('shortcutEnable').checked = true;
  document.getElementById('shortcutSelection').checked = false;
  document.getElementById('frameWidth').value = 550;
  document.getElementById('frameHeight').value = 250;
  document.getElementById('queryFormWidth').value = 250;
  document.getElementById('hideWithEscape').checked = true;
  document.getElementById('saveFrameSize').checked = true;
  document.getElementById('showExamples').checked = true;
  document.getElementById('showPOS').checked = false;
  document.getElementById('showLabels').checked = true;
  document.getElementById('showIPA').checked = true;
  document.getElementById('showAudio').checked = true;
  document.getElementById('showAudioLinks').checked = true;
  document.getElementById('showRelated').checked = false;
  document.getElementById('showSynonyms').checked = true;
  document.getElementById('showAntonyms').checked = false;
  document.getElementById('showLinks').checked = false;
  document.getElementById('showEtymology').checked = false;

  // Override defaults by saved settings.
  for (var i in selects) {
    var select = selects[i];
    var choice = localStorage.getObject(select);
    if (choice != null) setSelection(select, choice);
  }
  
  for (var i in checkboxes) {
    var checkbox = checkboxes[i];
    var checked = localStorage.getObject(checkbox);
    if (checked != null) document.getElementById(checkbox).checked = checked;
  }
  
  for (var i in textboxes) {
    var textbox = textboxes[i];
    var val = localStorage.getObject(textbox);
    if (val != null) document.getElementById(textbox).value = Math.round(val);
  }
  
  updateShortcutFields();
}

// Saves state to localStorage.
function saveOptions() {
  for (var i in selects) {
    var select = selects[i];
    localStorage.setObject(select, document.getElementById(select).value);
  }

  for (var i in checkboxes) {
    var checkbox = checkboxes[i];
    localStorage.setObject(checkbox, document.getElementById(checkbox).checked);
  }

  for (var i in textboxes) {
    var textbox = textboxes[i];
    var value = parseInt(document.getElementById(textbox).value);
    if (value) localStorage.setObject(textbox, value);
  }
  
  // Fade in status message.
  var status = document.getElementById('saveStatusMessage');
  status.style.opacity = 1;
  setTimeout(function() {
    status.style.opacity = 0;
  }, 1500);
}

function updateShortcutFields() {
  checked = document.getElementById('shortcutEnable').checked;
  document.getElementById('shortcutModifier').disabled = !checked;
  document.getElementById('shortcutKey').disabled = !checked;
  document.getElementById('shortcutSelection').disabled = !checked;
}

// Event binding
window.addEventListener('load', function() {
  restoreOptions();
  document.getElementById('shortcutEnable').addEventListener('click', updateShortcutFields);
  document.getElementById('saveOptions').addEventListener('click', saveOptions);
});

