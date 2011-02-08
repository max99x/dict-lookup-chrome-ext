"""Discards non-English sections of Wiktionary pages.

Expects input to be in the format produced by a WiktionaryFilter.
"""


from base import WiktionaryFilter
import re


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


class EnglishDefinitionFilter(WiktionaryFilter):
  """Discards non-English sections of multi-language Wiktionary pages."""

  def _startElement(self, name, attrs):
    """Captures page titles."""
    if name == 'page':
      self._cur_title = attrs['title']
    self._buffer = []

  def _endElement(self, name):
    """Extracts and writes English sections from pages."""
    if name != 'page': return

    data = ''.join(self._buffer)
    english_sections = RE_ENGLISH_SECTION.findall(data)
    if len(english_sections) != 1:
      raise Exception(u'Expected 1 English section, not %d. Data: %s' %
                      (len(english_sections), data))

    self._writePage(self._cur_title, english_sections[0])
