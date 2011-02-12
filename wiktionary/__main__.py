"""Converts a Wiktionary dump to a lookup database.

Requires an MediaWiki server with an empty database and template_expander.php to
be accessible via HTTP. Also requires the MediaWiki and the lookup databases to
be accessible via a MySQL server.
"""


import logging
import MySQLdb
import os
import urllib2
import canonizer
import filters.english_def
import filters.english_entry
import filters.strip_translations
import importer
import importtemplates


# Connection and login settings for the databases.
WIKI_DB = {
  'host': 'localhost',
  'user': 'root',
  'passwd': '',
  'db': 'wikidb'
}
LOOKUP_DB = {
  'host': 'localhost',
  'user': 'root',
  'passwd': '',
  'db': 'dictionary'
}

# The Wiktionary XML dump path.
DUMP_PATH = 'enwiktionary-latest-pages-articles.xml'
# The filenames of temporary files to create while running the pipeline.
TEMP1 = 'articles_01.xml'
TEMP2 = 'articles_02.xml'
TEMP3 = 'articles_03.xml'
TEMP4 = 'articles_04.xml'

# The URL of the template expander script in a MediaWiki installation.
TEMPLATE_EXPANDER_URL = ('http://127.0.0.1/mediawiki/template_expander.php?'
                         'src_dump=%s&dst_dump=%s')


def main():
  logging.basicConfig(level=logging.INFO)

  with MySQLdb.connect(**LOOKUP_DB) as lookup_cursor:
    with MySQLdb.connect(**WIKI_DB) as wiki_cursor:
      # Import templates from the dump to the MediaWiki DB.
      importtemplates.ImportTemplates(DUMP_PATH, wiki_cursor)

      # Extract entries with English definitions and simplify their format.
      filter = filters.english_entry.EnglishEntryFilter()
      total, accepted = filter.parseXmlDump(SRC_DUMP_PATH, TEMP1)
      logging.info('Retained %d entries from %d (%.2f%%).',
                   accepted, total, float(total) / accepted)

      # Discard non-English definitions from the entries.
      filter = filters.english_def.EnglishDefinitionFilter()
      filter.parseXmlDump(TEMP1, TEMP2)
      logging.info('Definition filter successful.')

      # Discard translation blocks from the entries.
      filter = filters.strip_translations.TraslationStrippingFilter()
      filter.parseXmlDump(TEMP2, TEMP3)
      logging.info('Translation stripping filter successful.')

      # Evaluate the MediaWiki templates in the entries.
      # This step takes aproximately 4.2 eternities. See template_expander.php.
      src = urllib2.quote(os.path.abspath(TEMP3), safe='')
      dest = urllib2.quote(os.path.abspath(TEMP4), safe='')
      expander_url = TEMPLATE_EXPANDER_URL % (src, dest)
      expander_connection = urllib2.urlopen(expander_url)
      for line in expander_connection:
        if line:
          logging.info(line)

      # Import pages from the MediaWiki dump to the lookup database.
      # The pages are cleaned up and converted to JSON during the import.
      importer.Importer().run(TEMP4, lookup_cursor)
      logging.info('Import successful.')

      # Create the soundex index for spelling corrections/suggestions.
      lookup_cursor.execute('UPDATE lookup SET sdx = SOUNDEX(name)')
      logging.info('Soundex generation successful.')

      # Redirect conjugated terms back to their parent canonical lemmas.
      # E.g. enjoyed -> enjoy, cats -> cat, better -> good.
      canonizer.Canonize(lookup_cursor)
      logging.info('Canonization successful.')


if __name__ == '__main__':
  main()
