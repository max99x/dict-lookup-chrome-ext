"""A filter for discarding entries that are not English definitions.

Discards "special" entries and entries that do not contain English definitions.
XML comments and all irrelevant XML elements are also discarded. The filter
expects to be passed a raw dump.
"""


from base import WiktionaryFilter
import re


# An XML comment regex.
RE_COMMENT = re.compile('<!--.*?-->', re.DOTALL)


class EnglishEntryFilter(WiktionaryFilter):
  """A filter for discarding entries that are not English definitions."""

  def __init__(self):
    self._total = 0
    self._accepted = 0

  def _endElement(self, name):
    """Writes accepted pages in a minimal form and discards the rest.

    When a title element is encountered, it is recorded for future usage.
    When a text element is encountered, it is checked for English definitions
    and if found, written as a page with the current title.
    All other elements are ignored (and therefore discarded).

    Args:
      name: The name of the element which has just ended.
    """
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
          data = RE_COMMENT.sub('', data)
          self._writePage(self._cur_title, data)
          self._accepted += 1

  def parseXmlDump(self, src_filename, dst_filename):
    """Runs the filter.

    Args:
      src_filename: The filename of the source XML dump to be parsed.
      dst_filename: The filename of the destination XML dump to be written.

    Returns:
      A 2-tuple of the total number of processed and accepted pages.
    """
    WiktionaryFilter.parseXmlDump(self, src_filename, dst_filename)
    return (self._total, self._accepted)
