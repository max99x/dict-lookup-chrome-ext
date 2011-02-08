"""Discards translation sections of Wiktionary pages.

Expects input to be in the format produced by a WiktionaryFilter.
"""


from base import WiktionaryFilter
import re


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


class TraslationStrippingFilter(WiktionaryFilter):
  """Discards translation sections of Wiktionary pages."""

  def _startElement(self, name, attrs):
    """Captures page titles."""
    if name == 'page':
      self._cur_title = attrs['title']
    self._buffer = []

  def _endElement(self, name):
    """Removes translation sections and writes the page."""
    if name != 'page': return

    data = ''.join(self._buffer)
    data = RE_TRANSLATION_SECTION.sub('', data)
    if '=Translations=' in data:
      raise Exception('Found unstripped translation in %s: %s' %
                      (self._cur_title, repr(data)))

    self._writePage(self._cur_title, data)
