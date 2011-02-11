"""Converts a Wiktionary dump to a lookup database."""


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

# The URL of the template expander script in a MediaWiki installation.
TEMPLATE_EXPANDER_URL = ('http://127.0.0.1/mediawiki/template_expander.php?'
                         'src_dump=%s&dst_dump=%s')


def main():
  logging.basicConfig(level=logging.INFO)

  temp1 = 'articles_01.xml'
  temp2 = 'articles_02.xml'
  temp3 = 'articles_03.xml'
  temp4 = 'articles_04.xml'

  with MySQLdb.connect(**LOOKUP_DB) as lookup_cursor:
    with MySQLdb.connect(**WIKI_DB) as wiki_cursor:
      # Import templates from the dump to the MediaWiki DB.
      importtemplates.ImportTemplates(DUMP_PATH, wiki_cursor)

      # Extract entries with English definitions and simplify their format.
      filter = filters.english_entry.EnglishEntryFilter()
      total, accepted = filter.parseXmlDump(SRC_DUMP_PATH, temp1)
      logging.info('Retained %d entries from %d (%.2f%%).',
                   accepted, total, float(total) / accepted)

      # Discard non-English definitions from the entries.
      filter = filters.english_def.EnglishDefinitionFilter()
      filter.parseXmlDump(temp1, temp2)
      logging.info('Definition filter successful.')

      # Discard translation blocks from the entries.
      filter = filters.strip_translations.TraslationStrippingFilter()
      filter.parseXmlDump(temp2, temp3)
      logging.info('Translation stripping filter successful.')

      # Evaluate the MediaWiki templates in the entries.
      # This step takes aproximately 4.2 eternities. See template_expander.php.
      src = urllib2.quote(os.path.abspath(temp3), safe='')
      dest = urllib2.quote(os.path.abspath(temp4), safe='')
      expander_url = TEMPLATE_EXPANDER_URL % (src, dest)
      expander_connection = urllib2.urlopen(expander_url)
      for line in expander_connection:
        if line:
          logging.info(line)

      # Import pages from the MediaWiki dump to the lookup database.
      # The pages are cleaned up and converted to JSON during the import.
      importer.Importer().run(temp4, lookup_cursor)
      logging.info('Import successful.')

      # Create the soundex index.
      lookup_cursor.execute('UPDATE lookup SET sdx = SOUNDEX(name)')
      logging.info('Soundex generation successful.')

      # Redirect conjugated terms back to their parent canonical lemmas.
      # E.g. enjoyed -> enjoy, cats -> cat, better -> good.
      canonizer.Canonize(lookup_cursor)


if __name__ == '__main__':
  main()
