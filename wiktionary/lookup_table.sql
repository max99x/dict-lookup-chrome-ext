CREATE TABLE `lookup` (
  `name` varbinary(127) NOT NULL,
  `text` text CHARACTER SET utf8,
  `sdx` varbinary(16) DEFAULT NULL,
  PRIMARY KEY (`name`),
  KEY `Soundex` (`sdx`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
