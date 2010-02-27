// Display Options.
var padding = 5;
var frame_width = 550;
var frame_height = 250;
var qform_width = 250;
var qform_height = 50;
var close_button_width = 10;
var scrollbar_width = 15;
var base_z_index = 9999;

// Internal global vars.
var body = document.getElementsByTagName('body')[0];
var last_frame = null;
var last_qform = null;
var last_button = null;
var last_time = (new Date()).getTime();

// Extension options.
var options = {
  clickModifier: 'Ctrl',
  shortcutModifier: 'Alt',
  shortcutKey: 'Q',
  shortcutEnable: true,
  shortcutSelection: false
}

// Load options.
function setOpt(opt) {
  chrome.extension.sendRequest(opt, function(response) {
    if (response != null) options[opt] = response;
  });
}

for (var opt in options) {
  setOpt(opt);
}

// Background Graying snippet, taken from: 
// http://www.hunlock.com/blogs/Snippets:_Howto_Grey-Out_The_Screen
function grayOut(vis, options) {
  // Pass true to gray out screen, false to ungray.
  var dark = document.getElementById('darkenScreenObject');
  var first_time = (dark == null);
  
  if (first_time) {
    // First time - create shading layer.
    var tnode = document.createElement('div');
    tnode.id = 'darkenScreenObject';
    
    tnode.style.position = 'absolute';
    tnode.style.top = '0px';
    tnode.style.left = '0px';
    tnode.style.overflow = 'hidden';
    
    document.body.appendChild(tnode);
    dark = document.getElementById('darkenScreenObject');
  }
  
  if (vis) {
    // Set the shader to cover the entire page and make it visible.
    dark.style.zIndex = base_z_index - 1;
    dark.style.backgroundColor = '#000000';
    dark.style.width = document.body.scrollWidth + 'px';
    dark.style.height = document.body.scrollHeight + 'px';
    dark.style.display = 'block';
    
    setTimeout(function() {dark.style.opacity = 0.7;}, 100);
  } else if (dark.style.opacity != 0) {
    dark.style.opacity = 0;
    setTimeout(function() {dark.style.display = 'none';}, 400);
  }
}

// Predicate to check whether the selected modifier key is active in an event.
function checkModifier(modifier, e) {
  switch (modifier) {
    case 'None':
      return true;
    case 'Ctrl':
      return e.ctrlKey;
    case 'Alt':
      return e.altKey;
    case 'Ctrl+Alt':
      return e.ctrlKey && e.altKey;
    case 'Ctrl+Shift':
      return e.ctrlKey && e.shiftKey;
    case 'Alt+Shift':
      return e.altKey && e.shiftKey;
    default:
      return false;
  }
}

// Returns a trimmed version of the currently selected text.
function getTrimmedSelection() {
  var selection = String(window.getSelection());
  selection = selection.replace(/^\s*/, '').replace(/\s*$/, '');
  return selection;
}

// Handle lookup-on-click.
function click_handler(e) {
  // Ignore duplicate clicks on selections.
  if ((new Date()).getTime() - last_time < 100) {
    return;
  } else {
    last_time = (new Date()).getTime();
  }

  // Remove last frame if one is displayed.
  removePopup(last_frame);
  removePopup(last_button);
  removePopup(last_qform);
  grayOut(false, {});
  last_frame = last_button = last_qform = null;
  
  // If control is held down and we have a selection, create a pop-up.
  if (checkModifier(options.clickModifier, e)) {
    var word = getTrimmedSelection();
    if (word != '') {
      createPopup(word, e.pageX, e.pageY, e.clientX, e.clientY);
    }
  }
}

// Handle keyboard shortcut.
function keypress_handler(e) {
  if (!options.shortcutEnable) return;
  if (!checkModifier(options.shortcutModifier, e)) return;
  if (options.shortcutKey.charCodeAt(0) != e.keyCode) return;
  
  // Remove last frame if one is displayed.
  removePopup(last_frame);
  removePopup(last_button);
  removePopup(last_qform);
  last_frame = last_button = last_qform = null;
   
  if (options.shortcutSelection && getTrimmedSelection() != '') {
    // Create new popup.
    createCenteredPopup(getTrimmedSelection());
  } else {
    grayOut(true, {});
    createQueryForm();
  }
}

function createQueryForm() {
  // Calculate the coordinates of the middle of the window.
  var windowX = (window.innerWidth - qform_width) / 2 - padding;
  var windowY = (window.innerHeight - qform_height) / 2 - padding;
  var x = document.body.scrollLeft + windowX;
  var y = document.body.scrollTop + windowY;
  
  // Create the form, set its basic attributes and insert it.
  qform = document.createElement('div');
  qform.className = 'GoogleDictChromeExt';
  
  body.appendChild(qform);
  
  // Set form style.
  qform.style.position = 'absolute';
  qform.style.left = x + 'px';
  qform.style.top = y + 'px';
  qform.style.width = qform_width + 'px';
  qform.style.height = qform_height + 'px';
  qform.style.padding = padding + 'px';
  qform.style.zIndex = base_z_index;
  
  // Initiate the fade-in animation in after 100 milliseconds.
  // Setting it now will not trigger the CSS3 animation sequence.
  setTimeout(function() {
    qform.style.opacity = 1;
  }, 100);
  
  // Add textbox.
  textbox = document.createElement('input');
  textbox.type = 'text';
  
  qform.appendChild(textbox);
  textbox.style.marginTop = '13px';
  textbox.style.marginLeft = '7px';
  textbox.style.border = '1px gray solid';
  textbox.style.fontFamily = 'Calibri, sans-serif';
  textbox.style.fontSize = '1.15em';
  textbox.style.width = '63%';
  
  textbox.addEventListener('keypress', function(e) {
    if (e.keyCode == 13) {
      setTimeout(function() {
        grayOut(false, {});
        createCenteredPopup(textbox.value);
        removePopup(last_qform);
        last_qform = null;
      }, 400);
    }
  }, false);
  
  textbox.focus();
  
  // Add button.
  button = document.createElement('input');
  button.type = 'button';
  button.value = 'Lookup';
  
  qform.appendChild(button);
  
  button.style.marginLeft = '10px';
  button.style.fontFamily = 'Calibri, sans-serif';
  button.style.fontSize = '1.15em';
  
  button.addEventListener('click', function(e) {
    setTimeout(function() {
      grayOut(false, {});
      createCenteredPopup(textbox.value);
      removePopup(last_qform);
      last_qform = null;
    }, 400);
  }, false);
  
  last_qform = qform;
}

function createCenteredPopup(word) {
  var windowX = (window.innerWidth - frame_width) / 2 - padding;
  var windowY = (window.innerHeight - frame_height) / 2 - padding;
  var x = document.body.scrollLeft + windowX;
  var y = document.body.scrollTop + windowY;
  
  // Create new popup.
  createPopup(word, x, y, windowX, windowY);
}

// Create and fade in the dictionary popup frame and button.
function createPopup(word, x, y, windowX, windowY) {
  // Create a frame, set its basic attributes and insert it.
  frame = document.createElement('iframe');
  frame.src = 'http://www.google.com/dictionary?langpair=en|en&q=' + escape(word) + '&hl=en&aq=f&source=unofficial_chrome_ext';
  frame.className = 'GoogleDictChromeExt';
  
  body.appendChild(frame);
  
  // Calculate frame position.
  var window_width = window.innerWidth;
  var window_height = window.innerHeight;
  var top = 0;
  var left = 0;
  
  if (windowX + frame_width >= window_width) {
    left = (x - frame_width - 2 * padding);
    if (left < 0) left = 5;
  } else {
    left = x;
  }
  
  if (windowY + frame_height >= window_height) {
    top = (y - frame_height - 2 * padding);
    if (top < 0) top = 5;
  } else {
    top = y;
  }
  
  // Set frame style.
  frame.style.position = 'absolute';
  frame.style.left = left + 'px';
  frame.style.top = top + 'px';
  frame.style.width = frame_width + 'px';
  frame.style.height = frame_height + 'px';
  frame.style.padding = padding + 'px';
  frame.style.zIndex = base_z_index;
  
  // Initiate the fade-in animation in after 100 milliseconds.
  // Setting it now will not trigger the CSS3 animation sequence.
  setTimeout(function() {
    frame.style.opacity = 1;
  }, 100);
  
  // Create a close button.
  close_button = document.createElement('div');
  close_button.innerText = 'x';
  close_button.id = 'GoogleDictChromeExtButton';
  
  body.appendChild(close_button);
  
  // Set close button style.
  close_button.style.fontFamily = 'Calibri, sans-serif';
  close_button.style.position = 'absolute';
  close_button.style.top = top + 'px';
  close_button.style.left = (left + frame_width - scrollbar_width - close_button_width) + 'px';
  close_button.style.zIndex = base_z_index + 1;
  close_button.style.width = close_button_width + 'px';
  close_button.style.height = close_button_width + 'px';
  close_button.style.color = 'navy';
  close_button.style.fontSize = '1.5em';
  close_button.style.cursor = 'pointer';
  
  // Set close button action.
  close_button.addEventListener('click', function() {
    removePopup(last_frame);
    removePopup(last_button);
    removePopup(last_qform);
    last_frame = last_button = last_qform = null;
  }, false);
    
  // Store a reference to the frame and the button.
  last_frame = frame;
  last_button = close_button;
}

// Fade out then destroy dictionary popup frame and button.
function removePopup(element) {
  if (element == null) return;
  
  // Initiate fade-out.
  element.style.opacity = 0;
  
  // After fade-out is finished, remove the elements.
  setTimeout(function() {
    body.removeChild(element);
    element = null;
  }, 400);
}

// Add click event listeners.
body.addEventListener('dblclick', click_handler, false);
body.addEventListener('click', click_handler, false);
body.addEventListener('keydown', keypress_handler, false);
