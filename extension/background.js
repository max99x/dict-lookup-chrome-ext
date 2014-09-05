// API URLs.
var DICT_API_URL = 'http://dictionary-lookup.org/%query%';
var AUDIO_API_URL = 'https://en.wiktionary.org/wiki/File:%file%';

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

// Helper to get extension version.
chrome.extension.getVersion = function() {
  if (!chrome.extension.version_) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL('manifest.json'), false);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4) {
        var manifest = JSON.parse(this.responseText);
        chrome.extension.version_ = manifest.version;
      }
    };
    xhr.send();
  }
  return chrome.extension.version_;
};

// Helper to send an AJAX request.
function sendAjaxRequest(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback(xhr.responseText);
    }
  }
  xhr.open('GET', url, true);
  xhr.send();
}

// Server procedure for content script.
// Receives a request containing two parameters:
//   method:
//     "lookup" for a Dictionary lookup.
//     "retrieve" to retrieve an object from local storage.
//     "store" to store an object in the local storage.
//     "get_audio" to look up the URL of a given Wikimedia audio file.
//   arg: the term to look up or the name of the object to retrieve/store.
//   arg2: the object to store. Used only with "store".
chrome.extension.onMessage.addListener(function(request, sender, callback) {
  if (request.method == 'retrieve') {
    // Return an object from local storage.
    callback(localStorage.getObject(request.arg));
  } else if (request.method == 'store') {
    // Return an object from local storage.
    localStorage.setObject(request.arg, request.arg2);
    callback('');
  } else if (request.method == 'lookup') {
    // Look up a term from the dictionary using the Ajax API.
    var url = DICT_API_URL.replace('%query%', request.arg);

    sendAjaxRequest(url, function(resp) {
      callback(JSON.parse(resp || '{}'));
    });
    
    return true; // Inform Chrome that we will make a delayed callback
  } else if (request.method == 'get_audio') {
    // Look up the URL of a given Wikimedia audio file.
    var url = AUDIO_API_URL.replace('%file%', request.arg);

    sendAjaxRequest(url, function(resp) {
      var url_match = resp.match(/<source src="([^"]+)" type="audio/);
      if (url_match && url_match.length == 2) {
        callback(url_match[1]);
      } else {
        callback('');
      }
    });
    
    return true; // Inform Chrome that we will make a delayed callback
  } else {
    // Invalid request method. Ignore it.
    callback('');
  }
});

// If new version is loaded, show the options page.
var current_version = chrome.extension.getVersion().split('.');
current_version = current_version[0] + '.' + current_version[1];

var saved_version = localStorage.getObject('version');
if (saved_version) {
  saved_version = saved_version.split('.');
  saved_version = saved_version[0] + '.' + saved_version[1];
} else {
  // Remap default modifier on different platforms.
  if (navigator.platform.match('Mac')) {
    localStorage.setObject('clickModifier', 'Meta');
    localStorage.setObject('shortcutModifier', 'Meta');
    localStorage.setObject('shortcutKey', 'D');
  } else if (navigator.platform.match('Linux')) {
    localStorage.setObject('clickModifier', 'Ctrl');
  } else {
    localStorage.setObject('clickModifier', 'Alt');
  }
}
if (saved_version != current_version) {
  localStorage.setObject('version', current_version);
  chrome.tabs.create({url: 'options.htm'});
}
