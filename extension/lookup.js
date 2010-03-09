// CSS-related constants. Should be synced with frame.css.
var ROOT_ID = 'chrome_ggl_dict_ext';
var FORM_ID = ROOT_ID + '_form';
var PADDING_LEFT = 10;
var PADDING_RIGHT = 0;
var PADDING_TOP = 15;
var PADDING_BOTTOM = 15;
var PADDING_FORM = 10;
var BASE_Z_INDEX = 65000;
var QUERY_FORM_HEIGHT = 50;

// URL constants.
var HANDLE_ICON_URL = chrome.extension.getURL('handle.png');
var BACK_ICON_URL = chrome.extension.getURL('back.png');
var LOADER_ICON_URL = chrome.extension.getURL('loader.gif');
var GRADIENT_DOWN_URL = chrome.extension.getURL('gradient_down.png');
var GRADIENT_UP_URL = chrome.extension.getURL('gradient_up.png');

// Internal global vars.
var body = document.getElementsByTagName('body')[0];
var breadcrumbs = [];
var last_query = null;

// Extension options with defaults.
var options = {
  clickModifier: 'Ctrl',
  shortcutModifier: 'Ctrl',
  shortcutKey: 'Q',
  shortcutEnable: true,
  shortcutSelection: false,
  frameWidth: 550,
  frameHeight: 250,
  queryFormWidth: 250,
  hideWithEscape: true,
  saveFrameSize: true
}

/***************************************************************
 *                          Entry Point                        *
 ***************************************************************/
// Main initialization function. Loads options and sets listeners.
function initialize() {
  // Load options.
  function setOpt(opt) {
    chrome.extension.sendRequest({method: 'retrieve', arg: opt}, function(response) {
      if (response != null) options[opt] = response;
    });
  }

  for (var opt in options) {
    setOpt(opt);
  }
  
  // Manually inject the stylesheet into non-HTML pages that have no <head>.
  if (!document.head) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = chrome.extension.getURL('frame.css');
    
    document.body.appendChild(link);
  }
  
  // Set event listeners.
  window.addEventListener('keydown', handleKeypress, false);
  setTimeout(function() {
    if (options.clickModifier == 'None') {
      window.addEventListener('mousedown', function(e) {
        if (!isClickInsideFrame(e)) removePopup(true, true);
      }, false);
      window.addEventListener('dblclick', handleClick, false);
    } else {
      window.addEventListener('mouseup', handleClick, false);
    }
  }, 100);
}

/***************************************************************
 *                        Event Handlers                       *
 ***************************************************************/
// Handle lookup-on-click.
function handleClick(e) {
  // Ignore clicks inside frame.
  is_inside_frame = isClickInsideFrame(e);

  // Remove frame or form if one is displayed.
  if (!is_inside_frame) removePopup(true, true);
  
  // If the modifier is held down and we have a selection, create a pop-up.
  if (checkModifier(options.clickModifier, e)) {
    var query = getTrimmedSelection();
    if (query != '') {
      if (is_inside_frame) {
        if (last_query) breadcrumbs.push(last_query);
        navigateFrame(query);
      } else {
        breadcrumbs = [];
        createPopup(query, e.pageX, e.pageY, e.clientX, e.clientY, false);
      }
      e.preventDefault();
      getSelection().removeAllRanges();
    }
  }
}

// Handle keyboard shortcut.
function handleKeypress(e) {
  if (options.hideWithEscape && e.keyCode == 27) {
    removePopup(true, true);
    return;
  }

  if (!options.shortcutEnable) return;
  if (!checkModifier(options.shortcutModifier, e)) return;
  if (options.shortcutKey.charCodeAt(0) != e.keyCode) return;
  
  if (options.shortcutSelection && getTrimmedSelection() != '') {
    // Lookup selection.
    removePopup(true, true);
    breadcrumbs = [];
    createCenteredPopup(getTrimmedSelection());
  } else {
    // Show query form if it's not already visible or clear it otherwise.
    if (!document.getElementById(FORM_ID)) {
      removePopup(true, false);
      grayOut(true);
      createQueryForm();
    } else {
      document.getElementById(FORM_ID).getElementsByTagName('input')[0].value = '';
    }
  }
}

// Handle clicks on related terms.
function navigateFrame(query) {
  var frame_ref = document.getElementById(ROOT_ID);
  var fixed = (document.defaultView.getComputedStyle(frame_ref, null).getPropertyValue('position') == 'fixed');
  var zoom_ratio = getZoomRatio();
  createPopup(query,
              frame_ref.offsetLeft * zoom_ratio, frame_ref.offsetTop * zoom_ratio,
              frame_ref.offsetLeft * zoom_ratio - body.scrollLeft, frame_ref.offsetTop * zoom_ratio - body.scrollTop,
              fixed);
}

/***************************************************************
 *                        UI Controllers                       *
 ***************************************************************/
// Creates and shows the manual query form.
function createQueryForm() {
  // Calculate the coordinates of the middle of the window.
  var windowX = (window.innerWidth - (PADDING_LEFT + options.queryFormWidth + PADDING_RIGHT)) / 2 ;
  var windowY = (window.innerHeight - (PADDING_TOP + QUERY_FORM_HEIGHT + PADDING_BOTTOM)) / 2;
  var x = body.scrollLeft + windowX;
  var y = body.scrollTop + windowY;
  
  // Create the form, set its id and insert it.
  var qform = document.createElement('div');
  qform.id = FORM_ID;
  body.appendChild(qform);
  
  // Set form style.
  var zoom_ratio = getZoomRatio();
  qform.style.position = 'absolute';
  qform.style.left = (x / zoom_ratio) + 'px';
  qform.style.top = (y / zoom_ratio) + 'px';
  qform.style.width = options.queryFormWidth + 'px';
  qform.style.zIndex = BASE_Z_INDEX;
    
  // Add textbox.
  textbox = document.createElement('input');
  textbox.type = 'text';
  qform.appendChild(textbox);
  
  function initLookup() {
    grayOut(false);
    removePopup(false, true);
    if (textbox.value.replace(/^\s+|\s+$/g, '') != '') {
      breadcrumbs = [];
      createCenteredPopup(textbox.value);
    }
  }
  
  textbox.focus();
  
  // Add button.
  button = document.createElement('input');
  button.type = 'button';
  button.value = 'Lookup';
  qform.appendChild(button);
  
  // Set lookup event handlers.
  textbox.addEventListener('keypress', function(e) {
    if (e.keyCode == 13) {  // Pressed Enter.
      setTimeout(initLookup, 400);
    }
  }, false);
    
  button.addEventListener('click', function(e) {
    setTimeout(initLookup, 400);
  }, false);
  
  // Schedule a resize of the textbox to accomodate the button in a single line.
  setTimeout(function() {
    var width = options.queryFormWidth - button.offsetWidth - 2 * PADDING_FORM - 3;
    textbox.style.width = width + 'px';
  }, 100);
  
  // Initiate the fade-in animation in after 100 milliseconds.
  // Setting it now will not trigger the CSS3 animation sequence.
  setTimeout(function() {
    qform.style.opacity = 1;
  }, 100);
}

// Create a centered pop-up.
function createCenteredPopup(query) {
  var windowX = (window.innerWidth - (PADDING_LEFT + options.frameWidth + PADDING_RIGHT)) / 2;
  var windowY = (window.innerHeight - (PADDING_TOP + options.frameHeight + PADDING_BOTTOM)) / 2;

  // Create new popup.
  createPopup(query, windowX, windowY, windowX, windowY, true);
}

// Create and fade in the dictionary popup frame and button.
function createPopup(query, x, y, windowX, windowY, fixed) {
  // If an old frame still exists, wait until it is killed.
  var frame_ref = document.getElementById(ROOT_ID);
  if (frame_ref) {
    if (frame_ref.style.opacity == 1) removePopup(true, false);
    setTimeout(function() {createPopup(query, x, y, windowX, windowY, fixed);}, 50);
    return;
  }

  // Create the frame, set its id and insert it.
  var frame = document.createElement('div');
  frame.id = ROOT_ID;
  // Unique class to differentiate between frame instances.
  frame.className = ROOT_ID + (new Date()).getTime();
  body.appendChild(frame);
  
  // Start loading frame data.
  chrome.extension.sendRequest({method: 'lookup', arg: query}, function(response) {
    if (response != null) {
      frame.innerHTML = createHtmlFromLookup(query, response);

      // Add some dynamic element after the HTML is loaded.
      setTimeout(function() {
        // Create a dragging handle.
        handle = document.createElement('div');
        handle.id = ROOT_ID + '_handle';
        frame.appendChild(handle);
        handle.style.background = 'url("' + HANDLE_ICON_URL + '") !important';
        
        makeResizeable(frame, handle);
        
        // Make frame draggable by its top.
        makeMoveable(frame, PADDING_TOP);
        
        // Create back link.
        if (breadcrumbs.length) {
          back = document.createElement('div');
          back.id = ROOT_ID + '_back';
          frame.appendChild(back);
          back.style.background = 'url("' + BACK_ICON_URL + '") !important';
          
          back.addEventListener('click', function() {
            navigateFrame(breadcrumbs.pop());
          });
        }
        
        // Resize shaders to avoid shading scroll bar arrows.
        shader_top = document.getElementById(ROOT_ID + '_shader_top');
        shader_bottom = document.getElementById(ROOT_ID + '_shader_bottom');
        if (shader_top && shader_bottom) {
          shader_top.style.width = (shader_top.offsetWidth - 16) + 'px';
          shader_bottom.style.width = (shader_bottom.offsetWidth - 16) + 'px';
        }
        
        // Hook into dictionary links.
        // TODO: remove this once we're sure it's no longer needed.
        dict_link_class = new RegExp('\\b' + ROOT_ID + '_dict_link\\b');
        links = frame.getElementsByTagName('a');
        for (var i in links) {
          if (links[i].className && links[i].className.search(dict_link_class) != -1) {
            links[i].addEventListener('click', function(e) {
              if (e.which == 1) {
                if (last_query) breadcrumbs.push(last_query);
                navigateFrame(this.innerText);
                e.preventDefault();
              }
            });
          }
        }
      }, 100);
    }
  });
  
  // Calculate frame position.
  var window_width = window.innerWidth;
  var window_height = window.innerHeight;
  var full_frame_width = PADDING_LEFT + options.frameWidth + PADDING_RIGHT;
  var full_frame_height = PADDING_TOP + options.frameHeight + PADDING_BOTTOM;
  var top = 0;
  var left = 0;
  var zoom_ratio = getZoomRatio();
  
  if (windowX + full_frame_width * zoom_ratio >= window_width) {
    left = x / zoom_ratio - full_frame_width;
    if (left < 0) left = 5;
  } else {
    left = x / zoom_ratio;
  }
  
  if (windowY + full_frame_height * zoom_ratio >= window_height) {
    top = y / zoom_ratio - full_frame_height;
    if (top < 0) top = 5;
  } else {
    top = y / zoom_ratio;
  }
  
  // Set frame style.
  frame.style.position = fixed ? 'fixed' : 'absolute';
  frame.style.left = left + 'px';
  frame.style.top = top + 'px';
  frame.style.width = options.frameWidth + 'px';
  frame.style.height = options.frameHeight + 'px';
  frame.style.zIndex = BASE_Z_INDEX;
  frame.style.background = 'white url("' + LOADER_ICON_URL + '") center no-repeat !important';
  
  // Initiate the fade-in animation in after 100 milliseconds.
  // Setting it now will not trigger the CSS3 animation sequence.
  setTimeout(function() {
    frame.style.opacity = 1;
  }, 100);
  
  last_query = query;
}

// Fade out then destroy the frame and/or form.
function removePopup(do_frame, do_form) {
  var form = document.getElementById(FORM_ID);
  
  if (form && do_form) {
    grayOut(false);
    form.style.opacity = 0;
    setTimeout(function() {if (form) body.removeChild(form);}, 400);
  }
  
  // Remember the current frame's unique class name.
  var frame_ref = document.getElementById(ROOT_ID);
  var frame_class = frame_ref ? frame_ref.className : null;
  
  if (frame_ref && do_frame) {
    frame_ref.style.opacity = 0;
    setTimeout(function() {
      var frame_ref = document.getElementById(ROOT_ID);
      // Check if the currently displayed frame is still the same as the old one.
      if (frame_ref && frame_ref.className == frame_class) {
        body.removeChild(frame_ref);
      }
    }, 400);
  }
}

function createHtmlFromLookup(query, response) {
  var buffer = [];
  
  buffer.push('<div id="' + ROOT_ID + '_content">');

  var entries = response.match(/<LI>(.+)/gi);
  var source = response.match(/<p>(.+)<\/p>/gi);
  
  if (!entries || entries.length == 0) {
    buffer.push('<div style="display: table; padding-top: 3em; width: 100%;"><div style="display: table-cell; text-align: center; vertical-align: middle;">No definitions for <b>' + query + '</b>.</div></div>');
  } else {
    buffer.push('<span class="' + ROOT_ID + '_title">' + query.toLowerCase() + '</span>');
    buffer.push('<ul>');
    for (var i in entries) {
      buffer.push('<li>');
      buffer.push(entries[i].substr(4));
      buffer.push('</li>');
    }
    buffer.push('</ul>');
    
    if (source && source.length) {
      buffer.push('<hr />');
      buffer.push(source[0]);
    }
  }

  buffer.push('</div>');

  buffer.push('<span id="' + ROOT_ID + '_shader_top" style="background: url(\'' + GRADIENT_DOWN_URL + '\') repeat-x !important"></span>');
  buffer.push('<span id="' + ROOT_ID + '_shader_bottom" style="background: url(\'' + GRADIENT_UP_URL + '\') repeat-x !important"></span>');
  
  return buffer.join('');
}

/***************************************************************
 *                   General Helper Functions                  *
 ***************************************************************/
// Background graying function, based on: 
// http://www.hunlock.com/blogs/Snippets:_Howto_Grey-Out_The_Screen
function grayOut(vis) {
  // Pass true to gray out screen, false to ungray.
  var dark_id = ROOT_ID + '_shader';
  var dark = document.getElementById(dark_id);
  var first_time = (dark == null);
  
  if (first_time) {
    // First time - create shading layer.
    var tnode = document.createElement('div');
    tnode.id = dark_id;
    
    tnode.style.position = 'absolute';
    tnode.style.top = '0px';
    tnode.style.left = '0px';
    tnode.style.overflow = 'hidden';
    
    document.body.appendChild(tnode);
    dark = document.getElementById(dark_id);
  }
  
  if (vis) {
    // Set the shader to cover the entire page and make it visible.
    dark.style.zIndex = BASE_Z_INDEX - 1;
    dark.style.backgroundColor = '#000000';
    dark.style.width = body.scrollWidth + 'px';
    dark.style.height = body.scrollHeight + 'px';
    dark.style.display = 'block';
    
    setTimeout(function() {dark.style.opacity = 0.7;}, 100);
  } else if (dark.style.opacity != 0) {
    setTimeout(function() {dark.style.opacity = 0;}, 100);
    setTimeout(function() {dark.style.display = 'none';}, 400);
  }
}

// Returns a trimmed version of the currently selected text.
function getTrimmedSelection() {
  var selection = String(window.getSelection());
  return selection.replace(/^\s+|\s+$/g, '');
}

// Returns the document body's zoom ratio.
function getZoomRatio() {
  var zoom_ratio = document.defaultView.getComputedStyle(body, null).getPropertyValue('zoom');
  return parseFloat(zoom_ratio || '0');
}

// Predicate to check whether the selected modifier key (and only it) is active
// in an event.
function checkModifier(modifier, e) {
  switch (modifier) {
    case 'None':
      return !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    case 'Ctrl':
      return e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    case 'Alt':
      return !e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey;
    case 'Meta':
      return !e.ctrlKey && !e.altKey && e.metaKey && !e.shiftKey;
    case 'Ctrl+Alt':
      return e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey;
    case 'Ctrl+Shift':
      return e.ctrlKey && !e.altKey && !e.metaKey && e.shiftKey;
    case 'Alt+Shift':
      return !e.ctrlKey && e.altKey && !e.metaKey && e.shiftKey;
    default:
      return false;
  }
}

// Makes a container resizeable through dragging a handle.
function makeResizeable(container, handle) {
  var last_position = {x: 0, y: 0};
  var ruler = document.createElement('div');
  ruler.style.visibility = 'none';
  ruler.style.width = '100px';

  function moveListener(e) {
    var moved = {x: (e.clientX - last_position.x),
                 y: (e.clientY - last_position.y)};

    var zoom_ratio = parseFloat(document.defaultView.getComputedStyle(ruler, null).getPropertyValue('width')) / 100;;
    var height = parseFloat(document.defaultView.getComputedStyle(container, null).getPropertyValue('height'));
    var width = parseFloat(document.defaultView.getComputedStyle(container, null).getPropertyValue('width'));
    var new_height = (height + moved.y) / zoom_ratio;
    var new_width = (width + moved.x) / zoom_ratio;

    if (moved.y > 0 || height >= 100) {
      last_position.y = e.clientY;
      container.style.height = new_height + 'px';
      content_box = document.getElementById(ROOT_ID + '_content');
      content_box.style.height = new_height + 'px';
      if (options.saveFrameSize) {
        options.frameHeight = new_height;
        chrome.extension.sendRequest({method: 'store', arg: 'frameHeight', arg2: new_height}, function(response) {});
      }
    }
    if (moved.x > 0 || width >= 250) {
      last_position.x = e.clientX;
      container.style.width = new_width + 'px';
      shader_top = document.getElementById(ROOT_ID + '_shader_top');
      shader_bottom = document.getElementById(ROOT_ID + '_shader_bottom');
      shader_top.style.width = (shader_top.offsetWidth + moved.x / zoom_ratio) + 'px';
      shader_bottom.style.width = (shader_bottom.offsetWidth + moved.x / zoom_ratio) + 'px';
      
      if (options.saveFrameSize) {
        options.frameWidth = new_width;
        chrome.extension.sendRequest({method: 'store', arg: 'frameWidth', arg2: new_width}, function(response) {});
      }
    }
    
    e.preventDefault();
  }

  handle.addEventListener('mousedown', function(e) {
    last_position = {x: e.clientX, y: e.clientY};
    window.addEventListener('mousemove', moveListener);
    body.appendChild(ruler);
    window.addEventListener('mouseup', function(e) {
      window.removeEventListener('mousemove', moveListener);
      try {
        body.removeChild(ruler);
      } catch (e) {}
      e.preventDefault();
    });
    e.preventDefault();
  });
}

// Makes a box moveable by dragging its top margin.
function makeMoveable(box, margin) {
  var last_position = {x: 0, y: 0};

  function moveListener(e) {
    var moved = {x: (e.clientX - last_position.x),
                 y: (e.clientY - last_position.y)};
    last_position = {x: e.clientX, y: e.clientY};
    box.style.top = (box.offsetTop + moved.y) + 'px';
    box.style.left = (box.offsetLeft + moved.x) + 'px';
    
    e.preventDefault();
  }

  box.addEventListener('mousedown', function(e) {
    var y = box.offsetTop;
    var zoom_ratio = getZoomRatio();
    var mouse_y = e.pageY / zoom_ratio;
    if (mouse_y >= y && mouse_y <= y + margin * zoom_ratio) {
      last_position = {x: e.clientX, y: e.clientY};
      window.addEventListener('mousemove', moveListener);
      window.addEventListener('mouseup', function(e) {
        window.removeEventListener('mousemove', moveListener);
        e.preventDefault();
      });
      e.preventDefault();
    }
  });
}

function isClickInsideFrame(e) {
  frame_ref = document.getElementById(ROOT_ID);
  if (frame_ref) {
    if (frame_ref.style.position == 'absolute') {
      var x = e.pageX;
      var y = e.pageY;
    } else if (frame_ref.style.position == 'fixed') {
      var x = e.clientX;
      var y = e.clientY;
    }
    
    var zoom_ratio = getZoomRatio();
    x /= zoom_ratio;
    y /= zoom_ratio;
    
    if (x >= frame_ref.offsetLeft &&
        x <= frame_ref.offsetLeft + frame_ref.offsetWidth &&
        y >= frame_ref.offsetTop &&
        y <= frame_ref.offsetTop + frame_ref.offsetHeight) {
      return true;
    }
  }
  
  return false;
}

/******************************************************************************/
initialize();
