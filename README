# Dictionary Lookup for Chrome

Dictionary Lookup is a Chrome extension that allows you to quickly look up
definitions of words and phrases in a clean inline box. The definitions come
from Wiktionary, but have been preprocessed to reduce formatting and provide
faster lookup. Hold Alt and double-click or select any word to look it up - an
inline box will open to the dictionary entry of that word, usually including
examples, audio pronunciation and synonyms.

## Parts

The application is powered by three separate parts:

* The actual Chrome extension that is embedded in pages, queries the lookup
  server for definitions and formats them for display. Written in Javascript.
* The lightweight lookup server script that receives word or phrase queries and
  returns matches from a local database. It also does some trivial spelling
  suggestions based on a a Soundex index. Written in PHP. The canonical server
  is hosted on <http://dictionary-lookup.org/>.
* The scripts which parse a Wiktionary dump and produce a database of machine
  readable definitions appropriate for quick lookup. Written mainly in Python.

## Building

The extension itself, located in the `extension` subfolder, does not require
building - it can be loaded or packed into a CRX by Chrome as is.

The lookup server script, located in the `lookup_server` subfolder, does not
require building either. However, it expects the lookup database built by the
Wiktionary parser to be accessible - the database settings can be edited at the
top of the file (the `$MYSQL_*` variables).

The Wiktionary parser is a little more complicated. Here's a step-by-step guide
to running the whole thing:

1. Run `wiktionary_setup/build-mediawiki.sh` to create a MediaWiki installation
   with the ExpandTemplates and ParserFunctions extensions and the additions
   needed by the Wiktionary parser. This is a dummy server that is only used to
   expand Wiktionary templates. You may need to edit the database settings in
   `wiktionary_setup/build-mediawiki.sh` before running the script. Note that
   this script requires the following commands to be available:
   * `wget`: for getting the MediaWiki source tarball. 
   * `tar`: for unpacking the source tarball.
   * `patch`: for applying parser-specific patches.
   * `svn`: for getting the required mediawiki extensions.
   * `mysql`: for creating the databases (mysqld must be running).
2. Setup a PHP-enabled Apache server and make sure it serves the mediawiki
   folder created in the previous step. It is not necessary (or recommended) to
   serve directly from the DocumentRoot.
3. Edit `mediawiki/LocalSettings.php` to set the database connection details
   (`$wgDB*`) and the URL path from which the mediawiki folder is served
   (`$wgScriptPath`).
4. Test that the MediaWiki server is working by pointing your browser at the
   path from which MediaWiki is being served. It should return an empty page
   with the HTTP status code 200.
5. Download and extract a Wiktionary dump, e.g. from:
   http://dumps.wikimedia.org/enwiktionary/latest/enwiktionary-latest-pages-articles.xml.bz2
6. Adjust the database, dump path and URL settings in `wiktionary/__main__.py`.
7. Run `wiktionary/__main__.py. This should execute the whole pipeline.
8. If everything went right, the final database in the format used by the lookup
   server will be in `LOOKUP_DB` (as specified in `wiktionary/__main__.py`).
