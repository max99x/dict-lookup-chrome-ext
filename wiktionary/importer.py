import MySQLdb
import json
from xml.parsers import expat
from wiktionaryparser import *

class ExpatReader(object):
    def __init__(self):
        self._handler = lambda x, y: None
        self._buffer = []
        self._title = None

    def _startElement(self, name, attrs):
        if name == 'page': self._title = attrs['title']
        self._buffer = []

    def _charData(self, data):
        self._buffer.append(data)

    def _endElement(self, name):
        if name == 'page': self._handler(self._title, ''.join(self._buffer))

    def run(self, src_filename, page_handler):
        self._handler = page_handler
        
        parser = expat.ParserCreate()
        parser.StartElementHandler = self._startElement
        parser.EndElementHandler = self._endElement
        parser.CharacterDataHandler = self._charData

        f = open(src_filename)
        try:
            parser.ParseFile(f)
        finally:
            f.close()

def importPage(title, page, cursor):
    meanings = parseMeanings(page)
    related = parseRelated(page)
    synonyms = parseSynonyms(page)
    antonyms = parseAntonyms(page)
    ipa = parseIPA(page)
    audio = parseAudio(page)
    etymology = parseEtymology(page)

    structured_page = {'term': title}
    if meanings: structured_page['meanings'] = meanings
    if related: structured_page['related'] = related
    if synonyms: structured_page['synonyms'] = synonyms
    if antonyms: structured_page['antonyms'] = antonyms
    if ipa: structured_page['ipa'] = ipa
    if audio: structured_page['audio'] = audio
    if etymology: structured_page['etymology'] = etymology[0]

    json_text = json.dumps(structured_page, separators=(',', ':'))
    
    cursor.execute('REPLACE INTO lookup VALUES(%s, %s, NULL)', [title, json_text])

if __name__ == '__main__':
    with MySQLdb.connect(host='localhost', user='root', passwd='',
                         db='dictionary', charset='utf8') as cursor:
        ExpatReader().run('articles_out4.xml', lambda x, y: importPage(x, y, cursor))
        cursor.execute('UPDATE lookup SET sdx = SOUNDEX(name)')
