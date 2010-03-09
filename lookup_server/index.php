<?php
$word = @$_GET['word'];
if (!$word) die();

mysql_pconnect('localhost', 'root', '') or die('{}');
mysql_select_db('dictionary') or die('{}');

$word = mysql_real_escape_string($word);
$res = mysql_query("SELECT text FROM lookup WHERE name = '$word';");

if (!$res || mysql_num_rows($res) != 1) {
  $word_lower = strtolower($word);
  $word_upper = strtoupper($word);
  $res = mysql_query("SELECT text FROM lookup WHERE name = '$word_lower' OR name = '$word_upper';");
  if (!$res || mysql_num_rows($res) != 1) die('{}');
}

header('Content-Type: text/json');

$row = mysql_fetch_row($res);
echo $row[0];
?>