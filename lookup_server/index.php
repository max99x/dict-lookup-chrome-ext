<?php

header('Content-Type: text/json');

function get_suggestions($word) {
  $res = mysql_query("SELECT   name
                      FROM     lookup
                      WHERE    sdx = SOUNDEX('$word')
                      ORDER BY ABS(LENGTH(name) - LENGTH('$word'))
                      LIMIT    300;");
    
  $candidates = array();
  $min = 999;
  for ($i = 0; $i < mysql_num_rows($res); $i++) {
    $row = mysql_fetch_row($res);
    $distance = levenshtein($word, $row[0]);
    if ($distance < $min) $min = $distance;
    $candidates[$row[0]] = $distance;
  }
  if ($min > 3) return '{}';
  $suggestions = array();
  foreach ($candidates as $word => $distance) {
    if ($min != $distance) continue;
    $suggestions[] = $word;
    if (count($suggestions) == 5) break;
  }
  
  return json_encode(array('suggestions' => $suggestions));
}

$word = @$_GET['word'];
if (!$word) die('{}');

mysql_pconnect('localhost', 'root', '') or die('{}');
mysql_select_db('dictionary') or die('{}');

$word = mysql_real_escape_string($word);
$res = mysql_query("SELECT text FROM lookup WHERE name = '$word';");

if (!$res || mysql_num_rows($res) != 1) {
  $word_lower = strtolower($word);
  $word_upper = strtoupper($word);
  $res = mysql_query("SELECT text FROM lookup WHERE name = '$word_lower' OR name = '$word_upper';");
  if (!$res || mysql_num_rows($res) != 1) {
    die(get_suggestions($word));
  }
}

$row = mysql_fetch_row($res);
echo $row[0];
?>