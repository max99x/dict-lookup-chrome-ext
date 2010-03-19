<?php
/*

This script takes an XML dump and expands all templates found in its pages.

This file should be dropped into a valid mediawiki installation with the
templates to expand already imported (e.g. with importtemplates.py).

Due to inefficiency in recursive template evaluation which needs many DB queries
per page, the script is quite slow. It takes about an hour to expand the English
parts of the Wiktionary dump on a mid-range PC.

*/

// Parameters.
$PRINT_PROGRESS_EVERY = 100;
$SRC_DUMP = 'articles_out3.xml';
$DST_DUMP = 'articles_out4.xml';

// Template expansion.
require_once('includes/WebStart.php');
$mw_parser_options = new ParserOptions;
$mw_parser_options->setRemoveComments(true);
$mw_parser_options->setMaxIncludeSize(50000000);

function expandTemplate($title, $text) {
  global $wgParser;
  global $mw_parser_options;
  
  return $wgParser->preprocess($text, Title::newFromText($title), $mw_parser_options);
}

// XML parsing/writing.
$parser = xml_parser_create();
$title = null;
$text = null;
$src = fopen($SRC_DUMP, 'r');
$dst = fopen($DST_DUMP, 'w');
$index = 0;

function start($parser, $element, $attrs) {
  global $title;
  global $text;
  
  if ($element == 'PAGE') {
    $title = $attrs['TITLE'];
    $text = '';
  }
}

function char($parser, $data) {
  global $text;
  
  $text .= $data;
}

function stop($parser, $element) {
  global $title;
  global $text;
  global $dst;
  global $index;
  global $PRINT_PROGRESS_EVERY;
  
  if ($element != 'PAGE') return;
  
  fwrite($dst, '<page title="'.htmlspecialchars($title, ENT_QUOTES).'" xml:space="preserve">');
  fwrite($dst, str_replace(array('&', '<', '>'), array('&amp;', '&lt;', '&gt;'),
                           expandTemplate($title, $text)));
  fwrite($dst, '</page>');
  
  $index++;
  if ($index % $PRINT_PROGRESS_EVERY == 0) {
    echo "$index pages expanded...\n";
  }
}

echo "Expanding...\n";
xml_set_element_handler($parser, 'start', 'stop');
xml_set_character_data_handler($parser, 'char');

fwrite($dst, '<pages>');
while ($data = fread($src, 4096)) {
  xml_parse($parser, $data, feof($src)) or die(sprintf("XML Error: %s at line %d", xml_error_string(xml_get_error_code($parser)), xml_get_current_line_number($parser)));
}
fwrite($dst, '</pages>');

fclose($dst);
fclose($src);

xml_parser_free($parser);

echo "Successfully expanded $index pages.";
?>
