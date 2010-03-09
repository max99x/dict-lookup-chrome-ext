from base import WiktionaryFilter
import re

class EnglishDefinitionFilter(WiktionaryFilter):
    '''
    Discards non-English sections of entries containing both English and
    non-English definitions. Expects input to be in the format produced by a
    WiktionaryFilter.
    '''
    
    RE_ENGLISH_SECTION = re.compile(r'''
    (?:^|\r\n|\r|\n)
    ==English==\s*
    (?:\r\n|\r|\n)
    \s*
    (.*?)
    \s*
    (?:
        (?:\r\n|\r|\n)
        ----+
        (?:\r\n|\r|\n)
      |
        (?:\r\n|\r|\n)
        ==
        \w
      |
        $
    )
    ''', re.VERBOSE | re.DOTALL | re.IGNORECASE | re.UNICODE)

    def _startElement(self, name, attrs):
        if name == 'page':
            self._cur_title = attrs['title']
        self._buffer = []
    
    def _endElement(self, name):
        if name != 'page': return

        data = ''.join(self._buffer)
        english_sections = self.RE_ENGLISH_SECTION.findall(data)
        if len(english_sections) != 1:
            raise Exception(u'Expected 1 English section, not %d. Data: %s' %
                            (len(english_sections), data))
        
        self._writePage(self._cur_title, english_sections[0])

if __name__ == '__main__':
    filter = EnglishDefinitionFilter()
    filter.parseXmlDump('articles_out.xml', 'articles_out2.xml')
    print 'Definition filter successful.'
