import xml.sax
import cPickle

class TemplateHandler(xml.sax.ContentHandler):
    def __init__(self):
        self.element = None
        self.page = None
        self.text = ''
        
    def startElement(self, name, attrs):
        self.element = name
        
    def endElement(self, name):
        if self.element == 'text':
            if self.page:
                Templates[self.page] = self.text
                self.page = None
            self.text = ''
        self.element = None
        
    def characters(self, content):
        if self.element == 'title':
            if content.startswith('Template:'):
                self.page = content[len('Template:'):]
            else:
                self.page = None
        elif self.element == 'text':
            if self.page:
                self.text += content

if __name__ == '__main__':
    # Load
    try:
        Templates = cPickle.load(open('templates.pickle'))
    except:
        Templates = {}
        with open('enwiktionary-latest-pages-articles.xml') as src_file:
            xml.sax.parse(src_file, TemplateHandler())
        with open('templates.pickle', 'w') as dest_file:
            cPickle.dump(Templates, dest_file)

    print "Loaded", len(Templates), "templates."

    # Import
    import MySQLdb

    with MySQLdb.connect(host='localhost', user='root', passwd='', db='wikidb') as cursor:
        index = 100
        for name, text in Templates.iteritems():
            cursor.execute('REPLACE INTO page VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (index, 10, name.replace(' ', '_').encode('utf8'), '', 1, '#redirect' in text and '\n' not in text, 1, 0.123, '20100318211940', index, len(text)))
            cursor.execute('REPLACE INTO text VALUES(%s, %s, %s)', (index, text.encode('utf8'), 'utf-8'))
            cursor.execute('REPLACE INTO revision VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', (index, index, index, '', 1, 'Admin', '20100318212019', 0, 0, 100, 0))
            index += 1

    print "Imported", index - 100, "templates."
