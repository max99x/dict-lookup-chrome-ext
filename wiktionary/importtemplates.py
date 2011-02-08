"""Imports all templates from a MediaWiki dump to a MediaWiki SQL database."""


import logging
import MySQLdb
import time
import xml.sax


# SQL queries used to insert templates.
PAGE_INSERT_SQL = '''
  REPLACE INTO page VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
'''
TEXT_INSERT_SQL = '''
  REPLACE INTO text VALUES(%s, %s, %s)
'''
REVISION_INSERT_SQL = '''
  REPLACE INTO revision VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
'''

# The starting index of the templates page IDs.
INDEX_START = 100

# The format of timestamps in the MediaWiki database.
TIMESTAMP_FORMAT = '%Y%m%d%H%M%S'


class TemplateHandler(xml.sax.ContentHandler):
  """A SAX handler that extracts template pages from a MediaWiki dump."""

  def __init__(self):
    self.element = None
    self.page = None
    self.text = ''
    self.templates = {}

  def startElement(self, name, attrs):
    """Sets the current element state."""
    self.element = name

  def endElement(self, name):
    """Resets element state and adds a new template for template pages."""
    if self.element == 'text':
      if self.page:
        self.templates[self.page] = self.text
        self.page = None
      self.text = ''
    self.element = None

  def characters(self, content):
    """Records title and content states."""
    if self.element == 'title':
      if content.startswith('Template:'):
        self.page = content[len('Template:'):]
      else:
        self.page = None
    elif self.element == 'text':
      if self.page:
        self.text += content


def InsertTemplate(connection, name, text, index):
  """Inserts a template into a MediaWiki database.

  Args:
    connection: The MySQL connection to use for running queries.
    name: The title of the template.
    text: The content of the template.
    index: The ID of the template. Used as page, revision and text ID.
  """
  encoded_name = name.replace(' ', '_').encode('utf8')
  encoded_text = text.encode('utf8')
  is_redirect = ('#redirect' in text) and ('\n' not in text)
  timestamp = time.strftime(TIMESTAMP_FORMAT)
  
  connection.execute(PAGE_INSERT_SQL, (index,         # page_id
                                       10,            # page_namespace
                                       encoded_name,  # page_title
                                       '',            # page_restrictions
                                       1,             # page_counter
                                       is_redirect,   # page_is_redirect
                                       1,             # page_is_new
                                       0.123,         # page_random
                                       timestamp,     # page_touched
                                       index,         # page_latest
                                       len(text)))    # page_len
  connection.execute(REVISION_INSERT_SQL, (index,     # rev_id
                                           index,     # rev_page
                                           index,     # rev_text_id
                                           '',        # rev_comment
                                           1,         # rev_user
                                           'Admin',   # rev_user_text
                                           timestamp, # rev_timestamp
                                           0,         # rev_minor_edit
                                           0,         # rev_deleted
                                           len(text), # rev_len
                                           0))        # rev_parent_id
  connection.execute(TEXT_INSERT_SQL, (index, encoded_text, 'utf-8'))


def ImportTemplates(source, db_info):
  """Extracts templates from a MediaWiki dump and inserts them into a database.

  Args:
    source: The file path of a MediaWiki XML dump from which the templates are
      to be extracted.
    db_info: The MediaWiki database connection info dictionary, including host,
      user, passwd and db keys.
  """
  handler = TemplateHandler()
  with open(source) as src_file:
    xml.sax.parse(src_file, handler)
  templates = handler.templates

  logging.info('Loaded %d templates.', len(templates))

  with MySQLdb.connect(**db_info) as connection:
    index = INDEX_START
    for name, text in templates.iteritems():
      InsertTemplate(connection, name, text, index)
      index += 1

  logging.info('Imported %d templates.', len(templates))


if __name__ == '__main__':
  ImportTemplates('enwiktionary-latest-pages-articles.xml',
                  dict(host='localhost', user='root', passwd='', db='wikidb'))
