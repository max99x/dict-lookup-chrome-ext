"""Imports pages from a MediaWiki dump into the lookup database."""


import json
from xml.parsers import expat
import wiktionaryparser


# The query used to insert new lookup values.
INSERTION_QUERY = 'REPLACE INTO lookup VALUES(%s, %s, NULL)'


class Importer(object):
  """Reads an XML dump and converts its pages into lookup DB records."""

  def __init__(self):
    self._cursor = None
    self._buffer = []
    self._title = None

  def _startElement(self, name, attrs):
    """Records page title."""
    if name == 'page':
      self._title = attrs['title']
    self._buffer = []

  def _charData(self, data):
    self._buffer.append(data)

  def _endElement(self, name):
    if name == 'page':
      self.importPage(self._title, ''.join(self._buffer))

  def importPage(self, title, page):
    """Converts a page into a JSON object and inserts it into the DB.

    Args:
      title: The name of the page.
      page: The textual content of the page.
    """
    meanings = wiktionaryparser.parseMeanings(page)
    related = wiktionaryparser.parseRelated(page)
    synonyms = wiktionaryparser.parseSynonyms(page)
    antonyms = wiktionaryparser.parseAntonyms(page)
    ipa = wiktionaryparser.parseIPA(page)
    audio = wiktionaryparser.parseAudio(page)
    etymology = wiktionaryparser.parseEtymology(page)

    structured_page = {'term': title}
    if meanings: structured_page['meanings'] = meanings
    if related: structured_page['related'] = related
    if synonyms: structured_page['synonyms'] = synonyms
    if antonyms: structured_page['antonyms'] = antonyms
    if ipa: structured_page['ipa'] = ipa
    if audio: structured_page['audio'] = audio
    if etymology: structured_page['etymology'] = etymology[0]

    title = title.encode('utf8')
    json_text = json.dumps(structured_page, separators=(',', ':'))

    try:
      self._cursor.execute(INSERTION_QUERY, (title, json_text))
    except:
      print repr(title)
      print repr(json_text)
      raise

  def run(self, src_filename, db_cursor):
    """Imports the specified XML dump to the lookup DB.
    
    Args:
      src_filename: The filename of the XML dump to import. Must be in the
        format created by a WiktionaryFilter.
      db_cursor: The database cursor to use for inserting new lookup records.
    """
    self._cursor = db_cursor
    parser = expat.ParserCreate()
    parser.StartElementHandler = self._startElement
    parser.EndElementHandler = self._endElement
    parser.CharacterDataHandler = self._charData

    f = open(src_filename)
    try:
      parser.ParseFile(f)
    finally:
      f.close()
