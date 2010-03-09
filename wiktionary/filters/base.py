from xml.parsers import expat
from xml.sax.saxutils import escape as xml_escape
from xml.sax.saxutils import quoteattr

class WiktionaryFilter(object):
    '''
    Base class for all filters. Produces XML in the form:

    <pages>
      <page title="..." xml:space="preserve">...</page>
      <page title="..." xml:space="preserve">...</page>
    </pages>
    '''
    
    TEMPLATE = '<page title=%s xml:space="preserve">%s</page>\n'

    def __init__(self):
        self._last_elem = None
        self._cur_title = None
        self._buffer = []
        self._src = None
        self._dst = None

    def _startElement(self, name, attrs):
        self._last_elem = name
        self._buffer = []

    def _charData(self, data):
        self._buffer.append(data)
    
    def _endElement(self, name):
        raise NotImplementedError('The element end handler should be defined by subclasses.')
    
    def _writePage(self, title, content):
        args = (quoteattr(title).encode('utf8'),
                xml_escape(content).encode('utf8'))
        self._dst.write(self.TEMPLATE % args)

    def parseXmlDump(self, src_filename, dst_filename):
        parser = expat.ParserCreate()
        parser.StartElementHandler = self._startElement
        parser.EndElementHandler = self._endElement
        parser.CharacterDataHandler = self._charData

        self._src = open(src_filename)
        self._dst = open(dst_filename, 'w')
        self._dst.write('<pages>\n')

        try:
            parser.ParseFile(self._src)
        finally:
            self._dst.write('</pages>')
            self._src.close()
            self._dst.close()
