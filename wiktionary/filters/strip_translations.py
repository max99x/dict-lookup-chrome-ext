from base import WiktionaryFilter
import re

class TraslationStrippingFilter(WiktionaryFilter):
    '''
    Discards the translation section of the articles. Expects input to be
    in the format produced by a WiktionaryFilter.
    '''
    
    RE_TRANSLATION_SECTION = re.compile(r'''
    (?:\r\n|\r|\n)
    ={3,}Translations?={3,}
    (?:
        (?:\r\n|\r|\n)
        .*?
        (?:
            (?=
               (?:\r\n|\r|\n)
               =
            )
          |
            $
        )
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
        data = self.RE_TRANSLATION_SECTION.sub('', data)
        if '=Translations=' in data:
            raise Exception(u'Found unstripped translation in %s: %s' %
                            (self._cur_title, repr(data)))

        self._writePage(self._cur_title, data)


if __name__ == '__main__':
    filter = TraslationStrippingFilter()
    filter.parseXmlDump('articles_out2.xml', 'articles_out3.xml')
    print 'Translation stripping filter successful.'
