// CSS-related constants. Should be synced with frame.css.
var ROOT_ID = 'chrome_ggl_dict_ext';
var FORM_ID = ROOT_ID + '_form';
var PADDING_LEFT = 10;
var PADDING_RIGHT = 0;
var PADDING_TOP = 15;
var PADDING_BOTTOM = 15;
var PADDING_FORM = 10;
var BASE_Z_INDEX = 65000;

// URL constants.
var EXTERN_LINK_TEMPLATE = 'http://www.google.com/dictionary?langpair=%src_lang%|%dst_lang%&q=%query%';
var SPEAKER_ICON_URL = chrome.extension.getURL('speaker.png');
var GOOGLE_ICON_URL = chrome.extension.getURL('google4.png');
var HANDLE_ICON_URL = chrome.extension.getURL('handle.png');
var BACK_ICON_URL = chrome.extension.getURL('back.png');
var LOADER_ICON_URL = chrome.extension.getURL('loader.gif');
var GRADIENT_DOWN_URL = chrome.extension.getURL('gradient_down.png');
var GRADIENT_UP_URL = chrome.extension.getURL('gradient_up.png');
var STARRED_ICON_URL = chrome.extension.getURL('starred.gif');
var UNSTARRED_ICON_URL = chrome.extension.getURL('unstarred.gif');

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
  queryFormHeight: 50,  // This one is an approximation for centering.
  hideWithEscape: true,
  saveFrameSize: true,
  showStar: true,
  showLabels: false,
  showConjugates: false,
  showWebDefinitions: true,
  showSynonyms: false,
  showRelated: false
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
  var windowY = (window.innerHeight - (PADDING_TOP + options.queryFormHeight + PADDING_BOTTOM)) / 2;
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
      frame.innerHTML = createHtmlFromLookup(response);

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
        
        // Hook into starring icon.
        if (options.showStar) {
          var star = document.getElementById(ROOT_ID + '_star');
          if (star) {
            star.addEventListener('click', function() {
              var operation = (this.src == UNSTARRED_ICON_URL) ? 'star': 'unstar';
              var star_image = this;
              
              chrome.extension.sendRequest({method: operation, arg: last_query}, function(response) {
                if (response) {
                  if (operation == 'star') {
                    star_image.src = STARRED_ICON_URL;
                  } else {
                    star_image.src = UNSTARRED_ICON_URL;
                  }
                }
              });
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

function createHtmlFromLookup(dict_entry) {
  var buffer = [];
  var audio_index = 0;
  
  function getAudioHtml(url) {
    var audio_id = ROOT_ID + '_audio_' + audio_index++;
    var action = "document.getElementById('" + audio_id + "').play()";
    return '<img class="' + ROOT_ID + '_speaker" src="' + SPEAKER_ICON_URL + '" title="Listen" onclick="' + action + '" /><audio id="' + audio_id + '" src="' + url + '" autobuffer></audio>';
  }
  
  buffer.push('<div id="' + ROOT_ID + '_content">');
  
  // Google Dictionary link.
  var extern_link = EXTERN_LINK_TEMPLATE;
  extern_link = extern_link.replace('%src_lang%', dict_entry.sourceLanguage);
  extern_link = extern_link.replace('%dst_lang%', dict_entry.targetLanguage);
  extern_link = extern_link.replace('%query%', dict_entry.query);
  buffer.push('<a id="' + ROOT_ID + '_logo" href="' + extern_link + '" target="_blank">');
  buffer.push('<img src="' + GOOGLE_ICON_URL + '" />');
  buffer.push('powered<br />by');
  buffer.push('</a>');
  
  dict_entry.primaries = dict_entry.primaries || [];
  dict_entry.webDefinitions = dict_entry.webDefinitions || [];
  if (dict_entry.primaries.length == 0 && dict_entry.webDefinitions.length == 0) {
    buffer.push('<div style="display: table; padding-top: 3em; width: 100%;"><div style="display: table-cell; text-align: center; vertical-align: middle;">No definitions for <b>' + dict_entry.query + '</b>.</div></div>');
  } else {
    // A recursive function to traverse the definitions/examples tree.
    function processEntry(entry, level) {
      var type = entry.type;
      var terms = entry.terms || [];
      var children = entry.entries || [];
      
      switch (type) {
        case 'container':
          if (entry.labels && entry.labels[0] && entry.labels[0].text) {
            buffer.push('</ol>');
            buffer.push('<div class="' + ROOT_ID + '_subtitle">' + entry.labels[0].text + '</div>');
            buffer.push('<ol>');
          }
          for (var i in children) {
            processEntry(children[i], level+1);
          }
          break;
        case 'headword':
        case 'meaning':
        case 'example':
          if (terms && terms.length) {
            buffer.push('<li>');
            
            for (var i in terms) {
              if (terms[i].text) {
                value = terms[i].text.replace(/^\s*|\s*$/g, '');
                if (i != 0 && terms[i].type != 'url') buffer.push(' &nbsp; ');
                if (terms[i].type == 'text') {       
                  if (type == 'headword') {
                    buffer.push('<span class="' + ROOT_ID + '_headword">' + value + '</span>');
                  } else {
                    buffer.push('<span>' + value + '</span>');
                  }
                  if (options.showLabels) {
                    for (var j in terms[i].labels) {
                      var label = terms[i].labels[j];
                      buffer.push(' ');
                      buffer.push('<span class="' + ROOT_ID + '_label" title="' + label.title + '">' + label.text + '</span>');
                    }
                  }
                } else if (terms[i].type == 'sound') {
                  buffer.push(getAudioHtml(value));
                } else if (terms[i].type == 'url') {
                  buffer.push(value.replace(/\?[^<>]*<\/a>$/, '</a>'));
                }
              }
            }
              
            if (children) {
              buffer.push('<ul class="' + ROOT_ID + '_examples">');
              for (var i in children) {
                processEntry(children[i], level+1);
              }
              buffer.push('</ul>');
            }
            
            buffer.push('</li>');
          } else {
            for (var i in children) {
              processEntry(children[i], level+1);
            }
          }
          break;
        case 'related':
          if (level != 0 && terms && terms.length) {
            var do_link = false;
            buffer.push('<li class="' + ROOT_ID + '_related">');
            if (entry.labels && entry.labels.length && entry.labels[0].text) {
              buffer.push(entry.labels[0].text.replace(':', '') + ': ');
              do_link = (entry.labels[0].text.search('See') != -1);
            } else {
              buffer.push('See also: ');
              do_link = true;
            }
              
            for (var i in terms) {
              if (terms[i].text && terms[i].type == 'text') {
                if (i != 0) buffer.push(', ');
                if (do_link) {
                  var extern_link = EXTERN_LINK_TEMPLATE;
                  extern_link = extern_link.replace('%src_lang%', dict_entry.sourceLanguage);
                  extern_link = extern_link.replace('%dst_lang%', dict_entry.targetLanguage);
                  extern_link = extern_link.replace('%query%', terms[i].text);
                  buffer.push('<a class="' + ROOT_ID + '_dict_link" href="' + extern_link + '" target="_blank">');
                  buffer.push(terms[i].text);
                  buffer.push('</a>');
                } else {
                  buffer.push(terms[i].text);
                }
              }
            }
            
            if (children.length) {
              buffer.push('<ul>');
              for (var i in children) {
                processEntry(children[i], level+1);
              }
              buffer.push('</ul>');
            }
          
            buffer.push('</li>');
          }
          break;
      }
    }
  
    var first_block = true;
  
    // Primary definition.
    if (dict_entry.primaries.length) {
      var primary = dict_entry.primaries[0];
      var sound_found = false;
      var main_title = null;
      
      // Header with formatted query and pronunciation.
      buffer.push('<div class="' + ROOT_ID + '_header">');
      
      for (var i in primary.terms) {
        var type = primary.terms[i].type;
        var value = primary.terms[i].text;
        switch (type) {
          case 'text':
            if (main_title == null) {
              if (options.showStar) {
                buffer.push('<img id="' + ROOT_ID + '_star" src="' + UNSTARRED_ICON_URL + '" />');
              }
              buffer.push('<span class="' + ROOT_ID + '_title">' + value + '</span>');
              main_title = value;
            }
            break;
          case 'phonetic':
            buffer.push('<span class="' + ROOT_ID + '_phonetic" title="Phonetic">' + value + '</span>');
            break;
          case 'sound':
            buffer.push(getAudioHtml(value));
            sound_found = true;
            break;
        }
      }
      
      // Default sound if none specified.
      if (!sound_found && main_title != null) {
        var query = main_title.toLowerCase().replace(/[-\s]+/g, '_');
        if (query.match(/^[a-z_]+$/i)) {
          var url = 'http://www.gstatic.com/dictionary/static/sounds/de/0/' + query + '.mp3';
          buffer.push(getAudioHtml(url));
        }
      }
    
      buffer.push('</div>');

      // Conjugates.
      if (options.showConjugates && primary.entries &&
          primary.entries[0] && primary.entries[0].type == 'related') {
        var terms = primary.entries[0].terms;
        buffer.push('<div id="' + ROOT_ID + '_conjugates">');
        for (var i in terms) {
          buffer.push('<span class="' + ROOT_ID + '_headword">' + terms[i].text + '</span>');
          for (var j in terms[i].labels) {
            buffer.push(' ');
            buffer.push('<span class="' + ROOT_ID + '_label">' + terms[i].labels[j].text + '</span>');
          }
          buffer.push('<br />');
        }
        buffer.push('</div>');
      }
      
      first_block = false;
    
      // Meanings.
      buffer.push('<ol id="' + ROOT_ID + '_meanings">');
      for (var i in primary.entries) {
        processEntry(primary.entries[i], 0);
      }
      buffer.push('</ol>');
    }
    
    // Synonyms
    if (options.showSynonyms && dict_entry.synonyms &&
        dict_entry.synonyms.length && dict_entry.synonyms[0].entries) {
      if (first_block) {
        first_block = false;
      } else {
        buffer.push('<hr class="' + ROOT_ID + '_separator" />');
      }
      buffer.push('<div class="' + ROOT_ID + '_subtitle">Synonyms</div>');
      
      var synonyms = dict_entry.synonyms[0].entries;
      
      buffer.push('<ol id="' + ROOT_ID + '_synonyms">');
      for (var i in synonyms) {
        if (synonyms[i].labels[0].text) {
          buffer.push('<li title="' + synonyms[i].labels[0].title + '">' + synonyms[i].labels[0].text + ': ');
          var first_synonym = true;
          for (var j in synonyms[i].terms) {
            if (first_synonym) {
              first_synonym = false;
            } else {
              buffer.push(', ');
            }
            var extern_link = EXTERN_LINK_TEMPLATE;
            extern_link = extern_link.replace('%src_lang%', dict_entry.sourceLanguage);
            extern_link = extern_link.replace('%dst_lang%', dict_entry.targetLanguage);
            extern_link = extern_link.replace('%query%', synonyms[i].terms[j].text);
            buffer.push('<a class="' + ROOT_ID + '_dict_link" href="' + extern_link + '">' + synonyms[i].terms[j].text + '</a>');
          }
          buffer.push('</li>');
        }
      }
      buffer.push('</ol>');
    }
    
    // Related Phrases
    if (options.showRelated && dict_entry.relatedPhrases &&
        dict_entry.relatedPhrases.length && dict_entry.relatedPhrases[0].entries) {
      if (first_block) {
        first_block = false;
      } else {
        buffer.push('<hr class="' + ROOT_ID + '_separator" />');
      }
      buffer.push('<div class="' + ROOT_ID + '_subtitle">Related Phrases</div>');
      
      var related = dict_entry.relatedPhrases;
      
      buffer.push('<ul id="' + ROOT_ID + '_related_phrases">');
      for (var i in related) {
        buffer.push('<li>');
        var first_headword = true;
        for (var j in related[i].terms) {
          if (first_headword) {
            first_headword = false;
          } else {
            buffer.push(', ');
          }
          var extern_link = EXTERN_LINK_TEMPLATE;
          extern_link = extern_link.replace('%src_lang%', dict_entry.sourceLanguage);
          extern_link = extern_link.replace('%dst_lang%', dict_entry.targetLanguage);
          extern_link = extern_link.replace('%query%', related[i].terms[j].text);
          buffer.push('<a class="' + ROOT_ID + '_headword ' + ROOT_ID + '_dict_link" href="' + extern_link + '">' + related[i].terms[j].text + '</a>');
        }
        buffer.push('<br />');
        buffer.push(related[i].entries[0].terms[0].text);
        buffer.push('</li>');
      }
      buffer.push('</ul>');
    }
    
    // Web definitions.
    if (options.showWebDefinitions && dict_entry.webDefinitions &&
        dict_entry.webDefinitions.length && dict_entry.webDefinitions[0].entries) {
      if (first_block) {
        first_block = false;
      } else {
        buffer.push('<hr class="' + ROOT_ID + '_separator" />');
      }
      buffer.push('<div class="' + ROOT_ID + '_subtitle">Web References</div>');
      
      var definition = dict_entry.webDefinitions[0];
      
      buffer.push('<ol class="' + ROOT_ID + '_references">');
      for (var i in definition.entries) {
        processEntry(definition.entries[i], 0);
      }
      buffer.push('</ol>');
    }
    
    // TODO(max99x): support Related Phrases.          
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

// Predicate to check whether the selected modifier key is active in an event.
function checkModifier(modifier, e) {
  switch (modifier) {
    case 'None':
      return true;
    case 'Ctrl':
      return e.ctrlKey;
    case 'Alt':
      return e.altKey;
    case 'Meta':
      return e.metaKey;
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
