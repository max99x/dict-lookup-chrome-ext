/*
SQLyog Community Edition- MySQL GUI v8.14 
MySQL - 5.1.54-community-log : Database - dictionary_lookup_mediawiki
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*Table structure for table `archive` */

CREATE TABLE `archive` (
  `ar_namespace` int(11) NOT NULL DEFAULT '0',
  `ar_title` varbinary(255) NOT NULL DEFAULT '',
  `ar_text` mediumblob NOT NULL,
  `ar_comment` tinyblob NOT NULL,
  `ar_user` int(10) unsigned NOT NULL DEFAULT '0',
  `ar_user_text` varbinary(255) NOT NULL,
  `ar_timestamp` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `ar_minor_edit` tinyint(4) NOT NULL DEFAULT '0',
  `ar_flags` tinyblob NOT NULL,
  `ar_rev_id` int(10) unsigned DEFAULT NULL,
  `ar_text_id` int(10) unsigned DEFAULT NULL,
  `ar_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `ar_len` int(10) unsigned DEFAULT NULL,
  `ar_page_id` int(10) unsigned DEFAULT NULL,
  `ar_parent_id` int(10) unsigned DEFAULT NULL,
  KEY `name_title_timestamp` (`ar_namespace`,`ar_title`,`ar_timestamp`),
  KEY `usertext_timestamp` (`ar_user_text`,`ar_timestamp`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `archive` */

LOCK TABLES `archive` WRITE;

UNLOCK TABLES;

/*Table structure for table `category` */

CREATE TABLE `category` (
  `cat_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cat_title` varbinary(255) NOT NULL,
  `cat_pages` int(11) NOT NULL DEFAULT '0',
  `cat_subcats` int(11) NOT NULL DEFAULT '0',
  `cat_files` int(11) NOT NULL DEFAULT '0',
  `cat_hidden` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`cat_id`),
  UNIQUE KEY `cat_title` (`cat_title`),
  KEY `cat_pages` (`cat_pages`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `category` */

LOCK TABLES `category` WRITE;

UNLOCK TABLES;

/*Table structure for table `categorylinks` */

CREATE TABLE `categorylinks` (
  `cl_from` int(10) unsigned NOT NULL DEFAULT '0',
  `cl_to` varbinary(255) NOT NULL DEFAULT '',
  `cl_sortkey` varbinary(70) NOT NULL DEFAULT '',
  `cl_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `cl_from` (`cl_from`,`cl_to`),
  KEY `cl_sortkey` (`cl_to`,`cl_sortkey`,`cl_from`),
  KEY `cl_timestamp` (`cl_to`,`cl_timestamp`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `categorylinks` */

LOCK TABLES `categorylinks` WRITE;

UNLOCK TABLES;

/*Table structure for table `change_tag` */

CREATE TABLE `change_tag` (
  `ct_rc_id` int(11) DEFAULT NULL,
  `ct_log_id` int(11) DEFAULT NULL,
  `ct_rev_id` int(11) DEFAULT NULL,
  `ct_tag` varbinary(255) NOT NULL,
  `ct_params` blob,
  UNIQUE KEY `change_tag_rc_tag` (`ct_rc_id`,`ct_tag`),
  UNIQUE KEY `change_tag_log_tag` (`ct_log_id`,`ct_tag`),
  UNIQUE KEY `change_tag_rev_tag` (`ct_rev_id`,`ct_tag`),
  KEY `change_tag_tag_id` (`ct_tag`,`ct_rc_id`,`ct_rev_id`,`ct_log_id`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `change_tag` */

LOCK TABLES `change_tag` WRITE;

UNLOCK TABLES;

/*Table structure for table `externallinks` */

CREATE TABLE `externallinks` (
  `el_from` int(10) unsigned NOT NULL DEFAULT '0',
  `el_to` blob NOT NULL,
  `el_index` blob NOT NULL,
  KEY `el_from` (`el_from`,`el_to`(40)),
  KEY `el_to` (`el_to`(60),`el_from`),
  KEY `el_index` (`el_index`(60))
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `externallinks` */

LOCK TABLES `externallinks` WRITE;

insert  into `externallinks`(`el_from`,`el_to`,`el_index`) values (1,'http://meta.wikimedia.org/wiki/Help:Contents','http://org.wikimedia.meta./wiki/Help:Contents');
insert  into `externallinks`(`el_from`,`el_to`,`el_index`) values (1,'http://www.mediawiki.org/wiki/Manual:Configuration_settings','http://org.mediawiki.www./wiki/Manual:Configuration_settings');
insert  into `externallinks`(`el_from`,`el_to`,`el_index`) values (1,'http://www.mediawiki.org/wiki/Manual:FAQ','http://org.mediawiki.www./wiki/Manual:FAQ');
insert  into `externallinks`(`el_from`,`el_to`,`el_index`) values (1,'https://lists.wikimedia.org/mailman/listinfo/mediawiki-announce','https://org.wikimedia.lists./mailman/listinfo/mediawiki-announce');

UNLOCK TABLES;

/*Table structure for table `filearchive` */

CREATE TABLE `filearchive` (
  `fa_id` int(11) NOT NULL AUTO_INCREMENT,
  `fa_name` varbinary(255) NOT NULL DEFAULT '',
  `fa_archive_name` varbinary(255) DEFAULT '',
  `fa_storage_group` varbinary(16) DEFAULT NULL,
  `fa_storage_key` varbinary(64) DEFAULT '',
  `fa_deleted_user` int(11) DEFAULT NULL,
  `fa_deleted_timestamp` binary(14) DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `fa_deleted_reason` blob,
  `fa_size` int(10) unsigned DEFAULT '0',
  `fa_width` int(11) DEFAULT '0',
  `fa_height` int(11) DEFAULT '0',
  `fa_metadata` mediumblob,
  `fa_bits` int(11) DEFAULT '0',
  `fa_media_type` enum('UNKNOWN','BITMAP','DRAWING','AUDIO','VIDEO','MULTIMEDIA','OFFICE','TEXT','EXECUTABLE','ARCHIVE') DEFAULT NULL,
  `fa_major_mime` enum('unknown','application','audio','image','text','video','message','model','multipart') DEFAULT 'unknown',
  `fa_minor_mime` varbinary(32) DEFAULT 'unknown',
  `fa_description` tinyblob,
  `fa_user` int(10) unsigned DEFAULT '0',
  `fa_user_text` varbinary(255) DEFAULT NULL,
  `fa_timestamp` binary(14) DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `fa_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`fa_id`),
  KEY `fa_name` (`fa_name`,`fa_timestamp`),
  KEY `fa_storage_group` (`fa_storage_group`,`fa_storage_key`),
  KEY `fa_deleted_timestamp` (`fa_deleted_timestamp`),
  KEY `fa_user_timestamp` (`fa_user_text`,`fa_timestamp`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `filearchive` */

LOCK TABLES `filearchive` WRITE;

UNLOCK TABLES;

/*Table structure for table `hitcounter` */

CREATE TABLE `hitcounter` (
  `hc_id` int(10) unsigned NOT NULL
) ENGINE=MEMORY DEFAULT CHARSET=latin1 MAX_ROWS=25000;

/*Data for the table `hitcounter` */

LOCK TABLES `hitcounter` WRITE;

UNLOCK TABLES;

/*Table structure for table `image` */

CREATE TABLE `image` (
  `img_name` varbinary(255) NOT NULL DEFAULT '',
  `img_size` int(10) unsigned NOT NULL DEFAULT '0',
  `img_width` int(11) NOT NULL DEFAULT '0',
  `img_height` int(11) NOT NULL DEFAULT '0',
  `img_metadata` mediumblob NOT NULL,
  `img_bits` int(11) NOT NULL DEFAULT '0',
  `img_media_type` enum('UNKNOWN','BITMAP','DRAWING','AUDIO','VIDEO','MULTIMEDIA','OFFICE','TEXT','EXECUTABLE','ARCHIVE') DEFAULT NULL,
  `img_major_mime` enum('unknown','application','audio','image','text','video','message','model','multipart') NOT NULL DEFAULT 'unknown',
  `img_minor_mime` varbinary(32) NOT NULL DEFAULT 'unknown',
  `img_description` tinyblob NOT NULL,
  `img_user` int(10) unsigned NOT NULL DEFAULT '0',
  `img_user_text` varbinary(255) NOT NULL,
  `img_timestamp` varbinary(14) NOT NULL DEFAULT '',
  `img_sha1` varbinary(32) NOT NULL DEFAULT '',
  PRIMARY KEY (`img_name`),
  KEY `img_usertext_timestamp` (`img_user_text`,`img_timestamp`),
  KEY `img_size` (`img_size`),
  KEY `img_timestamp` (`img_timestamp`),
  KEY `img_sha1` (`img_sha1`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `image` */

LOCK TABLES `image` WRITE;

UNLOCK TABLES;

/*Table structure for table `imagelinks` */

CREATE TABLE `imagelinks` (
  `il_from` int(10) unsigned NOT NULL DEFAULT '0',
  `il_to` varbinary(255) NOT NULL DEFAULT '',
  UNIQUE KEY `il_from` (`il_from`,`il_to`),
  UNIQUE KEY `il_to` (`il_to`,`il_from`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `imagelinks` */

LOCK TABLES `imagelinks` WRITE;

UNLOCK TABLES;

/*Table structure for table `interwiki` */

CREATE TABLE `interwiki` (
  `iw_prefix` varbinary(32) NOT NULL,
  `iw_url` blob NOT NULL,
  `iw_local` tinyint(1) NOT NULL,
  `iw_trans` tinyint(4) NOT NULL DEFAULT '0',
  UNIQUE KEY `iw_prefix` (`iw_prefix`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `interwiki` */

LOCK TABLES `interwiki` WRITE;

insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('acronym','http://www.acronymfinder.com/af-query.asp?String=exact&Acronym=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('advogato','http://www.advogato.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('annotationwiki','http://www.seedwiki.com/page.cfm?wikiid=368&doc=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('arxiv','http://www.arxiv.org/abs/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('c2find','http://c2.com/cgi/wiki?FindPage&value=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('cache','http://www.google.com/search?q=cache:$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('commons','http://commons.wikimedia.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('corpknowpedia','http://corpknowpedia.org/wiki/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('dictionary','http://www.dict.org/bin/Dict?Database=*&Form=Dict1&Strategy=*&Query=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('disinfopedia','http://www.disinfopedia.org/wiki.phtml?title=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('docbook','http://wiki.docbook.org/topic/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('doi','http://dx.doi.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('drumcorpswiki','http://www.drumcorpswiki.com/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('dwjwiki','http://www.suberic.net/cgi-bin/dwj/wiki.cgi?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('emacswiki','http://www.emacswiki.org/cgi-bin/wiki.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('elibre','http://enciclopedia.us.es/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('foldoc','http://foldoc.org/?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('foxwiki','http://fox.wikis.com/wc.dll?Wiki~$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('freebsdman','http://www.FreeBSD.org/cgi/man.cgi?apropos=1&query=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('gej','http://www.esperanto.de/cgi-bin/aktivikio/wiki.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('gentoo-wiki','http://gentoo-wiki.com/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('google','http://www.google.com/search?q=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('googlegroups','http://groups.google.com/groups?q=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('hammondwiki','http://www.dairiki.org/HammondWiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('hewikisource','http://he.wikisource.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('hrwiki','http://www.hrwiki.org/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('imdb','http://us.imdb.com/Title?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('jargonfile','http://sunir.org/apps/meta.pl?wiki=JargonFile&redirect=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('jspwiki','http://www.jspwiki.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('keiki','http://kei.ki/en/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('kmwiki','http://kmwiki.wikispaces.com/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('linuxwiki','http://linuxwiki.de/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('lojban','http://www.lojban.org/tiki/tiki-index.php?page=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('lqwiki','http://wiki.linuxquestions.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('lugkr','http://lug-kr.sourceforge.net/cgi-bin/lugwiki.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('mathsongswiki','http://SeedWiki.com/page.cfm?wikiid=237&doc=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('meatball','http://www.usemod.com/cgi-bin/mb.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('mediazilla','http://bugzilla.wikipedia.org/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('mediawikiwiki','http://www.mediawiki.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('memoryalpha','http://www.memory-alpha.org/en/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('metawiki','http://sunir.org/apps/meta.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('metawikipedia','http://meta.wikimedia.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('moinmoin','http://purl.net/wiki/moin/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('mozillawiki','http://wiki.mozilla.org/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('oeis','http://www.research.att.com/cgi-bin/access.cgi/as/njas/sequences/eisA.cgi?Anum=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('openfacts','http://openfacts.berlios.de/index.phtml?title=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('openwiki','http://openwiki.com/?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('patwiki','http://gauss.ffii.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('pmeg','http://www.bertilow.com/pmeg/$1.php',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('ppr','http://c2.com/cgi/wiki?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('pythoninfo','http://wiki.python.org/moin/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('rfc','http://www.rfc-editor.org/rfc/rfc$1.txt',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('s23wiki','http://is-root.de/wiki/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('seattlewiki','http://seattle.wikia.com/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('seattlewireless','http://seattlewireless.net/?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('senseislibrary','http://senseis.xmp.net/?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('slashdot','http://slashdot.org/article.pl?sid=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('sourceforge','http://sourceforge.net/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('squeak','http://wiki.squeak.org/squeak/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('susning','http://www.susning.nu/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('svgwiki','http://wiki.svg.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('tavi','http://tavi.sourceforge.net/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('tejo','http://www.tejo.org/vikio/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('tmbw','http://www.tmbw.net/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('tmnet','http://www.technomanifestos.net/?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('tmwiki','http://www.EasyTopicMaps.com/?page=$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('theopedia','http://www.theopedia.com/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('twiki','http://twiki.org/cgi-bin/view/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('uea','http://www.tejo.org/uea/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('unreal','http://wiki.beyondunreal.com/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('usemod','http://www.usemod.com/cgi-bin/wiki.pl?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('vinismo','http://vinismo.com/en/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('webseitzwiki','http://webseitz.fluxent.com/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('why','http://clublet.com/c/c/why?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wiki','http://c2.com/cgi/wiki?$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikia','http://www.wikia.com/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikibooks','http://en.wikibooks.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikicities','http://www.wikicities.com/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikif1','http://www.wikif1.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikihow','http://www.wikihow.com/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikinfo','http://www.wikinfo.org/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikimedia','http://wikimediafoundation.org/wiki/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikiquote','http://en.wikiquote.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikinews','http://en.wikinews.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikisource','http://sources.wikipedia.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikispecies','http://species.wikipedia.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikitravel','http://wikitravel.org/en/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wiktionary','http://en.wiktionary.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikipedia','http://en.wikipedia.org/wiki/$1',1,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wlug','http://www.wlug.org.nz/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('zwiki','http://zwiki.org/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('zzz wiki','http://wiki.zzz.ee/index.php/$1',0,0);
insert  into `interwiki`(`iw_prefix`,`iw_url`,`iw_local`,`iw_trans`) values ('wikt','http://en.wiktionary.org/wiki/$1',1,0);

UNLOCK TABLES;

/*Table structure for table `ipblocks` */

CREATE TABLE `ipblocks` (
  `ipb_id` int(11) NOT NULL AUTO_INCREMENT,
  `ipb_address` tinyblob NOT NULL,
  `ipb_user` int(10) unsigned NOT NULL DEFAULT '0',
  `ipb_by` int(10) unsigned NOT NULL DEFAULT '0',
  `ipb_by_text` varbinary(255) NOT NULL DEFAULT '',
  `ipb_reason` tinyblob NOT NULL,
  `ipb_timestamp` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `ipb_auto` tinyint(1) NOT NULL DEFAULT '0',
  `ipb_anon_only` tinyint(1) NOT NULL DEFAULT '0',
  `ipb_create_account` tinyint(1) NOT NULL DEFAULT '1',
  `ipb_enable_autoblock` tinyint(1) NOT NULL DEFAULT '1',
  `ipb_expiry` varbinary(14) NOT NULL DEFAULT '',
  `ipb_range_start` tinyblob NOT NULL,
  `ipb_range_end` tinyblob NOT NULL,
  `ipb_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `ipb_block_email` tinyint(1) NOT NULL DEFAULT '0',
  `ipb_allow_usertalk` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ipb_id`),
  UNIQUE KEY `ipb_address` (`ipb_address`(255),`ipb_user`,`ipb_auto`,`ipb_anon_only`),
  KEY `ipb_user` (`ipb_user`),
  KEY `ipb_range` (`ipb_range_start`(8),`ipb_range_end`(8)),
  KEY `ipb_timestamp` (`ipb_timestamp`),
  KEY `ipb_expiry` (`ipb_expiry`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `ipblocks` */

LOCK TABLES `ipblocks` WRITE;

UNLOCK TABLES;

/*Table structure for table `job` */

CREATE TABLE `job` (
  `job_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `job_cmd` varbinary(60) NOT NULL DEFAULT '',
  `job_namespace` int(11) NOT NULL,
  `job_title` varbinary(255) NOT NULL,
  `job_params` blob NOT NULL,
  PRIMARY KEY (`job_id`),
  KEY `job_cmd` (`job_cmd`,`job_namespace`,`job_title`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `job` */

LOCK TABLES `job` WRITE;

UNLOCK TABLES;

/*Table structure for table `langlinks` */

CREATE TABLE `langlinks` (
  `ll_from` int(10) unsigned NOT NULL DEFAULT '0',
  `ll_lang` varbinary(20) NOT NULL DEFAULT '',
  `ll_title` varbinary(255) NOT NULL DEFAULT '',
  UNIQUE KEY `ll_from` (`ll_from`,`ll_lang`),
  KEY `ll_lang` (`ll_lang`,`ll_title`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `langlinks` */

LOCK TABLES `langlinks` WRITE;

UNLOCK TABLES;

/*Table structure for table `logging` */

CREATE TABLE `logging` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `log_type` varbinary(10) NOT NULL DEFAULT '',
  `log_action` varbinary(10) NOT NULL DEFAULT '',
  `log_timestamp` binary(14) NOT NULL DEFAULT '19700101000000',
  `log_user` int(10) unsigned NOT NULL DEFAULT '0',
  `log_namespace` int(11) NOT NULL DEFAULT '0',
  `log_title` varbinary(255) NOT NULL DEFAULT '',
  `log_comment` varbinary(255) NOT NULL DEFAULT '',
  `log_params` blob NOT NULL,
  `log_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`log_id`),
  KEY `type_time` (`log_type`,`log_timestamp`),
  KEY `user_time` (`log_user`,`log_timestamp`),
  KEY `page_time` (`log_namespace`,`log_title`,`log_timestamp`),
  KEY `times` (`log_timestamp`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=binary;

/*Data for the table `logging` */

LOCK TABLES `logging` WRITE;

insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (6,'patrol','patrol','20100318220513',1,0,'Main_Page','','19469\n4\n1',0);
insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (2,'patrol','patrol','20100318212005',1,0,'Main_Page','','3\n1\n1',0);
insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (3,'patrol','patrol','20100318212019',1,0,'Main_Page','','4\n3\n1',0);
insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (4,'patrol','patrol','20100318213314',1,0,'Main_Page','','5\n4\n1',0);
insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (5,'patrol','patrol','20100318213507',1,0,'Main_Page','','6\n5\n1',0);
insert  into `logging`(`log_id`,`log_type`,`log_action`,`log_timestamp`,`log_user`,`log_namespace`,`log_title`,`log_comment`,`log_params`,`log_deleted`) values (7,'patrol','patrol','20100318220523',1,0,'Main_Page','','19470\n19469\n1',0);

UNLOCK TABLES;

/*Table structure for table `math` */

CREATE TABLE `math` (
  `math_inputhash` varbinary(16) NOT NULL,
  `math_outputhash` varbinary(16) NOT NULL,
  `math_html_conservativeness` tinyint(4) NOT NULL,
  `math_html` blob,
  `math_mathml` blob,
  UNIQUE KEY `math_inputhash` (`math_inputhash`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `math` */

LOCK TABLES `math` WRITE;

UNLOCK TABLES;

/*Table structure for table `objectcache` */

CREATE TABLE `objectcache` (
  `keyname` varbinary(255) NOT NULL DEFAULT '',
  `value` mediumblob,
  `exptime` datetime DEFAULT NULL,
  PRIMARY KEY (`keyname`),
  KEY `exptime` (`exptime`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `objectcache` */

LOCK TABLES `objectcache` WRITE;

UNLOCK TABLES;

/*Table structure for table `oldimage` */

CREATE TABLE `oldimage` (
  `oi_name` varbinary(255) NOT NULL DEFAULT '',
  `oi_archive_name` varbinary(255) NOT NULL DEFAULT '',
  `oi_size` int(10) unsigned NOT NULL DEFAULT '0',
  `oi_width` int(11) NOT NULL DEFAULT '0',
  `oi_height` int(11) NOT NULL DEFAULT '0',
  `oi_bits` int(11) NOT NULL DEFAULT '0',
  `oi_description` tinyblob NOT NULL,
  `oi_user` int(10) unsigned NOT NULL DEFAULT '0',
  `oi_user_text` varbinary(255) NOT NULL,
  `oi_timestamp` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `oi_metadata` mediumblob NOT NULL,
  `oi_media_type` enum('UNKNOWN','BITMAP','DRAWING','AUDIO','VIDEO','MULTIMEDIA','OFFICE','TEXT','EXECUTABLE','ARCHIVE') DEFAULT NULL,
  `oi_major_mime` enum('unknown','application','audio','image','text','video','message','model','multipart') NOT NULL DEFAULT 'unknown',
  `oi_minor_mime` varbinary(32) NOT NULL DEFAULT 'unknown',
  `oi_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `oi_sha1` varbinary(32) NOT NULL DEFAULT '',
  KEY `oi_usertext_timestamp` (`oi_user_text`,`oi_timestamp`),
  KEY `oi_name_timestamp` (`oi_name`,`oi_timestamp`),
  KEY `oi_name_archive_name` (`oi_name`,`oi_archive_name`(14)),
  KEY `oi_sha1` (`oi_sha1`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `oldimage` */

LOCK TABLES `oldimage` WRITE;

UNLOCK TABLES;

/*Table structure for table `page` */

CREATE TABLE `page` (
  `page_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `page_namespace` int(11) NOT NULL,
  `page_title` varbinary(255) NOT NULL,
  `page_restrictions` tinyblob NOT NULL,
  `page_counter` bigint(20) unsigned NOT NULL DEFAULT '0',
  `page_is_redirect` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `page_is_new` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `page_random` double unsigned NOT NULL,
  `page_touched` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `page_latest` int(10) unsigned NOT NULL,
  `page_len` int(10) unsigned NOT NULL,
  PRIMARY KEY (`page_id`),
  UNIQUE KEY `name_title` (`page_namespace`,`page_title`),
  KEY `page_random` (`page_random`),
  KEY `page_len` (`page_len`)
) ENGINE=MyISAM AUTO_INCREMENT=24512 DEFAULT CHARSET=binary;

/*Data for the table `page` */

LOCK TABLES `page` WRITE;

UNLOCK TABLES;

/*Table structure for table `page_props` */

CREATE TABLE `page_props` (
  `pp_page` int(11) NOT NULL,
  `pp_propname` varbinary(60) NOT NULL,
  `pp_value` blob NOT NULL,
  UNIQUE KEY `pp_page_propname` (`pp_page`,`pp_propname`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `page_props` */

LOCK TABLES `page_props` WRITE;

UNLOCK TABLES;

/*Table structure for table `page_restrictions` */

CREATE TABLE `page_restrictions` (
  `pr_page` int(11) NOT NULL,
  `pr_type` varbinary(60) NOT NULL,
  `pr_level` varbinary(60) NOT NULL,
  `pr_cascade` tinyint(4) NOT NULL,
  `pr_user` int(11) DEFAULT NULL,
  `pr_expiry` varbinary(14) DEFAULT NULL,
  `pr_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`pr_id`),
  UNIQUE KEY `pr_pagetype` (`pr_page`,`pr_type`),
  KEY `pr_typelevel` (`pr_type`,`pr_level`),
  KEY `pr_level` (`pr_level`),
  KEY `pr_cascade` (`pr_cascade`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `page_restrictions` */

LOCK TABLES `page_restrictions` WRITE;

UNLOCK TABLES;

/*Table structure for table `pagelinks` */

CREATE TABLE `pagelinks` (
  `pl_from` int(10) unsigned NOT NULL DEFAULT '0',
  `pl_namespace` int(11) NOT NULL DEFAULT '0',
  `pl_title` varbinary(255) NOT NULL DEFAULT '',
  UNIQUE KEY `pl_from` (`pl_from`,`pl_namespace`,`pl_title`),
  UNIQUE KEY `pl_namespace` (`pl_namespace`,`pl_title`,`pl_from`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `pagelinks` */

LOCK TABLES `pagelinks` WRITE;

UNLOCK TABLES;

/*Table structure for table `protected_titles` */

CREATE TABLE `protected_titles` (
  `pt_namespace` int(11) NOT NULL,
  `pt_title` varbinary(255) NOT NULL,
  `pt_user` int(10) unsigned NOT NULL,
  `pt_reason` tinyblob,
  `pt_timestamp` binary(14) NOT NULL,
  `pt_expiry` varbinary(14) NOT NULL DEFAULT '',
  `pt_create_perm` varbinary(60) NOT NULL,
  UNIQUE KEY `pt_namespace_title` (`pt_namespace`,`pt_title`),
  KEY `pt_timestamp` (`pt_timestamp`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `protected_titles` */

LOCK TABLES `protected_titles` WRITE;

UNLOCK TABLES;

/*Table structure for table `querycache` */

CREATE TABLE `querycache` (
  `qc_type` varbinary(32) NOT NULL,
  `qc_value` int(10) unsigned NOT NULL DEFAULT '0',
  `qc_namespace` int(11) NOT NULL DEFAULT '0',
  `qc_title` varbinary(255) NOT NULL DEFAULT '',
  KEY `qc_type` (`qc_type`,`qc_value`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `querycache` */

LOCK TABLES `querycache` WRITE;

UNLOCK TABLES;

/*Table structure for table `querycache_info` */

CREATE TABLE `querycache_info` (
  `qci_type` varbinary(32) NOT NULL DEFAULT '',
  `qci_timestamp` binary(14) NOT NULL DEFAULT '19700101000000',
  UNIQUE KEY `qci_type` (`qci_type`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `querycache_info` */

LOCK TABLES `querycache_info` WRITE;

UNLOCK TABLES;

/*Table structure for table `querycachetwo` */

CREATE TABLE `querycachetwo` (
  `qcc_type` varbinary(32) NOT NULL,
  `qcc_value` int(10) unsigned NOT NULL DEFAULT '0',
  `qcc_namespace` int(11) NOT NULL DEFAULT '0',
  `qcc_title` varbinary(255) NOT NULL DEFAULT '',
  `qcc_namespacetwo` int(11) NOT NULL DEFAULT '0',
  `qcc_titletwo` varbinary(255) NOT NULL DEFAULT '',
  KEY `qcc_type` (`qcc_type`,`qcc_value`),
  KEY `qcc_title` (`qcc_type`,`qcc_namespace`,`qcc_title`),
  KEY `qcc_titletwo` (`qcc_type`,`qcc_namespacetwo`,`qcc_titletwo`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `querycachetwo` */

LOCK TABLES `querycachetwo` WRITE;

UNLOCK TABLES;

/*Table structure for table `recentchanges` */

CREATE TABLE `recentchanges` (
  `rc_id` int(11) NOT NULL AUTO_INCREMENT,
  `rc_timestamp` varbinary(14) NOT NULL DEFAULT '',
  `rc_cur_time` varbinary(14) NOT NULL DEFAULT '',
  `rc_user` int(10) unsigned NOT NULL DEFAULT '0',
  `rc_user_text` varbinary(255) NOT NULL,
  `rc_namespace` int(11) NOT NULL DEFAULT '0',
  `rc_title` varbinary(255) NOT NULL DEFAULT '',
  `rc_comment` varbinary(255) NOT NULL DEFAULT '',
  `rc_minor` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_bot` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_new` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_cur_id` int(10) unsigned NOT NULL DEFAULT '0',
  `rc_this_oldid` int(10) unsigned NOT NULL DEFAULT '0',
  `rc_last_oldid` int(10) unsigned NOT NULL DEFAULT '0',
  `rc_type` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_moved_to_ns` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_moved_to_title` varbinary(255) NOT NULL DEFAULT '',
  `rc_patrolled` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_ip` varbinary(40) NOT NULL DEFAULT '',
  `rc_old_len` int(11) DEFAULT NULL,
  `rc_new_len` int(11) DEFAULT NULL,
  `rc_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rc_logid` int(10) unsigned NOT NULL DEFAULT '0',
  `rc_log_type` varbinary(255) DEFAULT NULL,
  `rc_log_action` varbinary(255) DEFAULT NULL,
  `rc_params` blob,
  PRIMARY KEY (`rc_id`),
  KEY `rc_timestamp` (`rc_timestamp`),
  KEY `rc_namespace_title` (`rc_namespace`,`rc_title`),
  KEY `rc_cur_id` (`rc_cur_id`),
  KEY `new_name_timestamp` (`rc_new`,`rc_namespace`,`rc_timestamp`),
  KEY `rc_ip` (`rc_ip`),
  KEY `rc_ns_usertext` (`rc_namespace`,`rc_user_text`),
  KEY `rc_user_text` (`rc_user_text`,`rc_timestamp`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=binary;

/*Data for the table `recentchanges` */

LOCK TABLES `recentchanges` WRITE;

UNLOCK TABLES;

/*Table structure for table `redirect` */

CREATE TABLE `redirect` (
  `rd_from` int(10) unsigned NOT NULL DEFAULT '0',
  `rd_namespace` int(11) NOT NULL DEFAULT '0',
  `rd_title` varbinary(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`rd_from`),
  KEY `rd_ns_title` (`rd_namespace`,`rd_title`,`rd_from`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `redirect` */

LOCK TABLES `redirect` WRITE;

UNLOCK TABLES;

/*Table structure for table `revision` */

CREATE TABLE `revision` (
  `rev_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rev_page` int(10) unsigned NOT NULL,
  `rev_text_id` int(10) unsigned NOT NULL,
  `rev_comment` tinyblob NOT NULL,
  `rev_user` int(10) unsigned NOT NULL DEFAULT '0',
  `rev_user_text` varbinary(255) NOT NULL DEFAULT '',
  `rev_timestamp` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `rev_minor_edit` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rev_deleted` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `rev_len` int(10) unsigned DEFAULT NULL,
  `rev_parent_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`rev_id`),
  UNIQUE KEY `rev_page_id` (`rev_page`,`rev_id`),
  KEY `rev_timestamp` (`rev_timestamp`),
  KEY `page_timestamp` (`rev_page`,`rev_timestamp`),
  KEY `user_timestamp` (`rev_user`,`rev_timestamp`),
  KEY `usertext_timestamp` (`rev_user_text`,`rev_timestamp`)
) ENGINE=MyISAM AUTO_INCREMENT=24512 DEFAULT CHARSET=binary MAX_ROWS=10000000 AVG_ROW_LENGTH=1024;

/*Data for the table `revision` */

LOCK TABLES `revision` WRITE;

UNLOCK TABLES;

/*Table structure for table `searchindex` */

CREATE TABLE `searchindex` (
  `si_page` int(10) unsigned NOT NULL,
  `si_title` varchar(255) NOT NULL DEFAULT '',
  `si_text` mediumtext NOT NULL,
  UNIQUE KEY `si_page` (`si_page`),
  FULLTEXT KEY `si_title` (`si_title`),
  FULLTEXT KEY `si_text` (`si_text`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

/*Data for the table `searchindex` */

LOCK TABLES `searchindex` WRITE;

UNLOCK TABLES;

/*Table structure for table `site_stats` */

CREATE TABLE `site_stats` (
  `ss_row_id` int(10) unsigned NOT NULL,
  `ss_total_views` bigint(20) unsigned DEFAULT '0',
  `ss_total_edits` bigint(20) unsigned DEFAULT '0',
  `ss_good_articles` bigint(20) unsigned DEFAULT '0',
  `ss_total_pages` bigint(20) DEFAULT '-1',
  `ss_users` bigint(20) DEFAULT '-1',
  `ss_active_users` bigint(20) DEFAULT '-1',
  `ss_admins` int(11) DEFAULT '-1',
  `ss_images` int(11) DEFAULT '0',
  UNIQUE KEY `ss_row_id` (`ss_row_id`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `site_stats` */

LOCK TABLES `site_stats` WRITE;

UNLOCK TABLES;

/*Table structure for table `tag_summary` */

CREATE TABLE `tag_summary` (
  `ts_rc_id` int(11) DEFAULT NULL,
  `ts_log_id` int(11) DEFAULT NULL,
  `ts_rev_id` int(11) DEFAULT NULL,
  `ts_tags` blob NOT NULL,
  UNIQUE KEY `tag_summary_rc_id` (`ts_rc_id`),
  UNIQUE KEY `tag_summary_log_id` (`ts_log_id`),
  UNIQUE KEY `tag_summary_rev_id` (`ts_rev_id`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `tag_summary` */

LOCK TABLES `tag_summary` WRITE;

UNLOCK TABLES;

/*Table structure for table `templatelinks` */

CREATE TABLE `templatelinks` (
  `tl_from` int(10) unsigned NOT NULL DEFAULT '0',
  `tl_namespace` int(11) NOT NULL DEFAULT '0',
  `tl_title` varbinary(255) NOT NULL DEFAULT '',
  UNIQUE KEY `tl_from` (`tl_from`,`tl_namespace`,`tl_title`),
  UNIQUE KEY `tl_namespace` (`tl_namespace`,`tl_title`,`tl_from`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `templatelinks` */

LOCK TABLES `templatelinks` WRITE;

UNLOCK TABLES;

/*Table structure for table `text` */

CREATE TABLE `text` (
  `old_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `old_text` mediumblob NOT NULL,
  `old_flags` tinyblob NOT NULL,
  PRIMARY KEY (`old_id`)
) ENGINE=MyISAM AUTO_INCREMENT=24512 DEFAULT CHARSET=binary MAX_ROWS=10000000 AVG_ROW_LENGTH=10240;

/*Data for the table `text` */

LOCK TABLES `text` WRITE;

UNLOCK TABLES;

/*Table structure for table `trackbacks` */

CREATE TABLE `trackbacks` (
  `tb_id` int(11) NOT NULL AUTO_INCREMENT,
  `tb_page` int(11) DEFAULT NULL,
  `tb_title` varbinary(255) NOT NULL,
  `tb_url` blob NOT NULL,
  `tb_ex` blob,
  `tb_name` varbinary(255) DEFAULT NULL,
  PRIMARY KEY (`tb_id`),
  KEY `tb_page` (`tb_page`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `trackbacks` */

LOCK TABLES `trackbacks` WRITE;

UNLOCK TABLES;

/*Table structure for table `transcache` */

CREATE TABLE `transcache` (
  `tc_url` varbinary(255) NOT NULL,
  `tc_contents` blob,
  `tc_time` int(11) NOT NULL,
  UNIQUE KEY `tc_url_idx` (`tc_url`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `transcache` */

LOCK TABLES `transcache` WRITE;

UNLOCK TABLES;

/*Table structure for table `updatelog` */

CREATE TABLE `updatelog` (
  `ul_key` varbinary(255) NOT NULL,
  PRIMARY KEY (`ul_key`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `updatelog` */

LOCK TABLES `updatelog` WRITE;

UNLOCK TABLES;

/*Table structure for table `user` */

CREATE TABLE `user` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varbinary(255) NOT NULL DEFAULT '',
  `user_real_name` varbinary(255) NOT NULL DEFAULT '',
  `user_password` tinyblob NOT NULL,
  `user_newpassword` tinyblob NOT NULL,
  `user_newpass_time` binary(14) DEFAULT NULL,
  `user_email` tinyblob NOT NULL,
  `user_options` blob NOT NULL,
  `user_touched` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `user_token` binary(32) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  `user_email_authenticated` binary(14) DEFAULT NULL,
  `user_email_token` binary(32) DEFAULT NULL,
  `user_email_token_expires` binary(14) DEFAULT NULL,
  `user_registration` binary(14) DEFAULT NULL,
  `user_editcount` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  KEY `user_email_token` (`user_email_token`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=binary;

/*Data for the table `user` */

LOCK TABLES `user` WRITE;

insert  into `user`(`user_id`,`user_name`,`user_real_name`,`user_password`,`user_newpassword`,`user_newpass_time`,`user_email`,`user_options`,`user_touched`,`user_token`,`user_email_authenticated`,`user_email_token`,`user_email_token_expires`,`user_registration`,`user_editcount`) values (1,'Admin','',':B:5b66af33:963124212b22154ebd83fb0a7e1fdc16','',NULL,'','quickbar=1\nunderline=2\ncols=80\nrows=25\nsearchlimit=20\ncontextlines=5\ncontextchars=50\ndisablesuggest=0\nskin=\nmath=1\nusenewrc=0\nrcdays=7\nrclimit=50\nwllimit=250\nhideminor=0\nhidepatrolled=0\nnewpageshidepatrolled=0\nhighlightbroken=1\nstubthreshold=0\npreviewontop=1\npreviewonfirst=0\neditsection=1\neditsectiononrightclick=0\neditondblclick=0\neditwidth=0\nshowtoc=1\nshowtoolbar=1\nminordefault=0\ndate=default\nimagesize=2\nthumbsize=2\nrememberpassword=0\nnocache=0\ndiffonly=0\nshowhiddencats=0\nnorollbackdiff=0\nenotifwatchlistpages=0\nenotifusertalkpages=1\nenotifminoredits=0\nenotifrevealaddr=0\nshownumberswatching=1\nfancysig=0\nexternaleditor=0\nexternaldiff=0\nforceeditsummary=0\nshowjumplinks=1\njustify=0\nnumberheadings=0\nuselivepreview=0\nwatchlistdays=3\nextendwatchlist=0\nwatchlisthideminor=0\nwatchlisthidebots=0\nwatchlisthideown=0\nwatchlisthideanons=0\nwatchlisthideliu=0\nwatchlisthidepatrolled=0\nwatchcreations=0\nwatchdefault=0\nwatchmoves=0\nwatchdeletion=0\nnoconvertlink=0\ngender=unknown\nvariant=en\nlanguage=en\nsearchNs0=1','20110208150417','4ad8ce384b450db9a75b85879bc085e0',NULL,'\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0',NULL,'20100318201827',7);

UNLOCK TABLES;

/*Table structure for table `user_groups` */

CREATE TABLE `user_groups` (
  `ug_user` int(10) unsigned NOT NULL DEFAULT '0',
  `ug_group` varbinary(16) NOT NULL DEFAULT '',
  UNIQUE KEY `ug_user_group` (`ug_user`,`ug_group`),
  KEY `ug_group` (`ug_group`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `user_groups` */

LOCK TABLES `user_groups` WRITE;

insert  into `user_groups`(`ug_user`,`ug_group`) values (1,'bureaucrat');
insert  into `user_groups`(`ug_user`,`ug_group`) values (1,'sysop');

UNLOCK TABLES;

/*Table structure for table `user_newtalk` */

CREATE TABLE `user_newtalk` (
  `user_id` int(11) NOT NULL DEFAULT '0',
  `user_ip` varbinary(40) NOT NULL DEFAULT '',
  `user_last_timestamp` binary(14) NOT NULL DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
  KEY `user_id` (`user_id`),
  KEY `user_ip` (`user_ip`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `user_newtalk` */

LOCK TABLES `user_newtalk` WRITE;

UNLOCK TABLES;

/*Table structure for table `valid_tag` */

CREATE TABLE `valid_tag` (
  `vt_tag` varbinary(255) NOT NULL,
  PRIMARY KEY (`vt_tag`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `valid_tag` */

LOCK TABLES `valid_tag` WRITE;

UNLOCK TABLES;

/*Table structure for table `watchlist` */

CREATE TABLE `watchlist` (
  `wl_user` int(10) unsigned NOT NULL,
  `wl_namespace` int(11) NOT NULL DEFAULT '0',
  `wl_title` varbinary(255) NOT NULL DEFAULT '',
  `wl_notificationtimestamp` varbinary(14) DEFAULT NULL,
  UNIQUE KEY `wl_user` (`wl_user`,`wl_namespace`,`wl_title`),
  KEY `namespace_title` (`wl_namespace`,`wl_title`)
) ENGINE=MyISAM DEFAULT CHARSET=binary;

/*Data for the table `watchlist` */

LOCK TABLES `watchlist` WRITE;

UNLOCK TABLES;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
