from base import WiktionaryFilter
import re

class EnglishEntryFilter(WiktionaryFilter):
    '''
    A filter for discarding "special" entries and entries that do not contain
    English definitions. XML comments and all irrelevant XML elements are also
    discarded. Accepts raw dump.
    '''

    RE_COMMENT = re.compile('<!--.*?-->', re.DOTALL)
    
    def __init__(self):
        self._total = 0
        self._accepted = 0
        
    def _endElement(self, name):
        self._last_elem = None
        if name not in ('title', 'text'): return

        data = ''.join(self._buffer)

        if name == 'title':
            self._cur_title = data
        elif name == 'text':
            self._total += 1
            if not self._cur_title:
                raise Exception('No title for data: ' + data)
            elif ':' in self._cur_title:
                self._cur_title = None
            else:
                if '==English==' in data:
                    data = self.RE_COMMENT.sub('', data)
                    self._writePage(self._cur_title, data)
                    self._accepted += 1

    def parseXmlDump(self, src_filename, dst_filename):
        WiktionaryFilter.parseXmlDump(self, src_filename, dst_filename)
        
        return (self._total, self._accepted)

if __name__ == '__main__':
    filter = EnglishEntryFilter()
    total, accepted = filter.parseXmlDump('enwiktionary-latest-pages-articles.xml',
                                          'articles_out.xml')
    print ('Retained %d entries from %d (%.2f%%).' %
           (accepted, total, float(total) / accepted))
