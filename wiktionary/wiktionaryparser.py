"""Parses out meanings, examples and other elements from a Wiktionary page.

This script attempts to parse out a machine-readable set of meanings, examples,
pronunciations, synonyms, antonyms and other elements from the awful mess
usually found in Wiktionary pages.

The script operates on previously filtered pages with templates (but not Wiki
markup) expanded. Due to the messy nature of this source material, the script
is an equally messy jumble of regex and various hardcoded assumptions. The
output is pretty much guaranteed not to be 100% clean, but with enough quality
control it may be quite usable.
"""


import itertools
import re
import urllib2
import BeautifulSoup as beautifulsoup


# Finds 2 or more consequent whitespace characters.
RE_MULTISPACE = re.compile(ur'\s{2,}', re.UNICODE)

# Captures list items of bulleted lists. These are lines that start with an
# asterisk in Wiki markup. The asterisk is not captured.
RE_BULLET_ITEM = re.compile(ur'^\*(.+)$', re.UNICODE | re.MULTILINE)
# Captures list items of numbered lists. These are lines that start with a
# hash mark (#) in Wiki markup. The hash mark is not captured.
RE_NUMBERED_ITEM = re.compile(ur'^#(.+)$', re.UNICODE | re.MULTILINE)

# Captures text that should appear emphasized (in italics). This is anything
# between two pairs of single quotes. E.g. takes "abc ''def''ghi" and captures
# "def".
RE_EMPHASIS = re.compile(ur"''(.*?)''", re.UNICODE)
# Captures text that should appear strong (in bold). This is anything between
# two triples of single quotes. E.g. takes "abc '''def'''ghi" and captures
# "def". Note that this should be applied before RE_EMPHASIS.
RE_STRONG = re.compile(ur"'''(?!')(.*?)'''", re.UNICODE)

# Finds internal Wiktionary links. Captures the linked term, the link text and
# the link "tail". Ignores any URL fragments (anything after a hash mark) in the
# term. The final link text is {link text + tail} if link text is present and
# {term + tail} if it isn't. Tail is usually (but not always!) empty. The term
# may also contain a colon for category or inter-wiki links in which case the
# term is everything after the last colon as far as link text is concerned.
RE_INNER_LINK = re.compile(ur'''
  \[\[
    ([^\#]+?)
    (?:
      \#
      [^|\[\]]*
    )?
    (?:
      \|
      (.*?)
    )?
  \]\]
  (\w*)
''', re.UNICODE | re.VERBOSE)
# Finds links to arbitrary URLs. Captures the URL and the optional link text.
RE_EXTERN_LINK = re.compile(ur'''
  (?<!\[)
  \[
    [^\s\[\]]*
    (?:
      \s+
      ([^\]]*)
    )?
  \]
  (?!\])
''', re.UNICODE | re.VERBOSE)
# Finds inter-project links. Captures the Wiki markup link as well as the
# enclosing span (which is marked with an interProject class.
RE_INTERPROJECT_LINK = re.compile(
    ur'<span class="interProject">.*?</span>', re.UNICODE)

# Finds generic tags to be removed from the results of a wiki markup evaluation.
# Non-empty <em> and <strong> tags are not matched. The contents of the tags are
# not captured.
RE_TAG = re.compile(ur'''
    <
      (?!
        /?
        (?:em|strong)
        >
      )
      [^>]*
    >
  |
    <em></em>
  |
    <strong></strong>
''', re.UNICODE | re.VERBOSE)
# Finds span tags which add hover titles. Captures their contents.
RE_TITLED_TAG = re.compile(ur'''
  <span \s title="[^>]*">
    (.*?)
  </span>
''', re.UNICODE | re.VERBOSE | re.DOTALL)

# Finds qualifier spans. Qualifiers are words or phrases that indicate the area
# in which a given word is used in the specified meaning. E.g. in the definition
# of "free" that states "Unconstrained by relators.", the quantifier is
# "mathematics". This regex captures the qualifier span and all its contents.
RE_QUALIFIER_TAG = re.compile(ur'''
  <span \s class="qualifier-[^>"]*">
    .*?
  </span>
''', re.UNICODE | re.VERBOSE | re.DOTALL)
# Finds and captures the contents of the qualifier-content spans. Ignores other
# qualifier spans such as qualifier-brac and qualifier-comma.
RE_QUALIFIER_CONTENT = re.compile(ur'''
  <span \s class="qualifier-content">
    (.+?)
  </span>
''', re.UNICODE | re.VERBOSE | re.DOTALL)
# Finds manually-styled qualifiers. Captures any preceding non-word characters
# as well as the contents of the qualifier.
RE_QUALIFIER_UNFORMATTED = re.compile(ur'''
  ^
  (
    (?:
        \W
      |
        <[^>]*>
    )*
  )
  (?:<em>)?
  \s*
  \(
    (?:<em>)?
      (
        [^()<>]+
      )
    (?:</em>)?
  \)
  \s*
  (?:</em>)?
''', re.UNICODE | re.VERBOSE)
# A proper qualifier replacement string with placeholders for replacing
# unformatted qualifiers.
QUALIFIER_CONTENT = ur'\1<span class="qualifier-content">\2</span>'
# The fancily formatted qualifier comma.
QUALIFIER_COMMA = ('<span class="ib-comma"><span class="qualifier-comma">,'
                   '</span></span>')

# Finds deletion or verification request tags. Captures the tag and all its
# contents.
RE_REQUEST = re.compile(ur'''
  <span \s style="color:\s*\#777777;">
    .*?
    (?:
      Requests_for_verification
      |
      Requests_for_deletion
    )
    .*?
  </span>
''', re.UNICODE | re.VERBOSE | re.DOTALL)

# Matches lines that start with colons or some combination of list item markers.
RE_EXAMPLE_START = re.compile(ur'''
  ^
  (
      [*#]
      [:#*]?
    |
      :
  )
''', re.UNICODE | re.VERBOSE)
# Finds and captures example content given a full example line. Strips any
# preceding decoration (list item markers, etc.). Contains a fair amount of
# voodoo.
RE_EXAMPLE_BREAK = re.compile(ur'''
  (?:
      ^
    |
      (?<=
        [^\w<]
      )
      (?<!
        \[\[
      )
  )
  (?=
    [<\[\'"\w&]
  )
  (.+)
''', re.UNICODE | re.VERBOSE)
# Matches lines that start with a bold year (optionally preceded by arbitrary
# markup or preceded/followed by non-word characters). Used to find quotation
# attributions in example lists.
RE_INIT_YEAR = re.compile(ur"""
  ^
  (?:\W|<[^>]*>)*
  '''
    \d{4}
    [^a-zA-Z]*
  '''
""", re.UNICODE | re.VERBOSE)

# Finds pronunciation blocks with audio links. Captures the pronuncation type
# (e.g. "Audio (US)") and the filename of the pronunciation audio file.
RE_AUDIO_TAG = re.compile(ur'''
  <td \s+ class="unicode \s+ audiolink">
    ([^<>]+)  # The pronunciation type.
  </td>
  \s*
  <td \s+ class="audiofile" \s+ rowspan="2">
    \[\[
    Image:
    ([^<>]+)  # The filename.
    \|
    [^<>]+    # Usually "50px".
    \|
    [^<>]+    # Usually "noicon".
    \]\]
  </td>
''', re.UNICODE | re.VERBOSE)
# Finds the main part of a pronunciation type. For example, takes
# "Audio (US-South)" and captures "US". Similarly, takes "BlahXY-Z" and captures
# "XY-Z".
RE_AUDIO_TYPE = re.compile(ur'''
  [A-Z]
  (?:
    [-/\\A-Z]*
    [A-Z]
  )
  \b
''', re.UNICODE | re.VERBOSE)

# Finds the International Phonetic Alphabet pronunciation spans. Captures the
# contents of said spans.
RE_IPA = re.compile(ur'<span class="IPA">(.*?)</span>', re.UNICODE)

# A template for regexes that aim to find a section title of depth 3 or more.
# Should be formatter with a regex that matches the desired section title.
# Captures the title and the text of the section between the title and the next
# (or until the end).
SECTION_REGEX_TEMPLATE = ur'''
  (?:^|\r|\n|\r\n)
  ={3,}
  (?:\{\{)?
  (%s)
  (?:\}\})?
  ={3,}
  \s*?
  (?:^|\r|\n|\r\n)
  (.*?)
  (?:(?=(?:^|\r|\n|\r\n)=)|$)
'''
# Finds and captures section titles and their text.
RE_SECTION = re.compile(
    SECTION_REGEX_TEMPLATE % ur'[^\n]*?', re.UNICODE | re.VERBOSE | re.DOTALL)
# Finds and captures synonym section titles and their text.
RE_SYNONYM_SECTIONS = re.compile(
    SECTION_REGEX_TEMPLATE % '[Ss]ynonyms', re.UNICODE | re.VERBOSE | re.DOTALL)
# Finds and captures antonym section titles and their text.
RE_ANTONYM_SECTIONS = re.compile(
    SECTION_REGEX_TEMPLATE % '[Aa]ntonyms', re.UNICODE | re.VERBOSE | re.DOTALL)
# Finds and captures etymology section titles and their text.
RE_ETYMOLOGY_SECTIONS = re.compile(
    SECTION_REGEX_TEMPLATE % '[Ee]tymology(?:\ \d+)?',
    re.UNICODE | re.VERBOSE | re.DOTALL)
# Headers for sections containing terms related to the current term.
RELATED_HEADERS = ['See\ also', 'Related\ terms', 'Derived\ terms',
                   'Coordinate\ terms', 'Troponyms', 'Alternative\ forms']
# Finds and captures related terms section titles and their text.
RE_RELATED_SECTIONS = re.compile(
      SECTION_REGEX_TEMPLATE % '|'.join(RELATED_HEADERS),
      re.UNICODE | re.VERBOSE | re.IGNORECASE | re.DOTALL)
# The titles of sections that contain definitions (meanings).
MEANING_HEADERS = set([
  # Standard POS headers.
  'noun', 'noun 1', 'noun 2', 'verb', 'adjective', 'adverb', 'pronoun',
  'conjunction', 'interjection', 'preposition', 'proper noun', 'article',
  # Standard non-POS level 3 headers.
  'acronym', 'abbreviation', 'initialism', 'contraction', 'prefix', 'suffix',
  'symbol', 'letter', 'idiom', 'idioms', 'phrase',
  # Debated POS level 3 headers.
  'number', 'numeral', 'cardinal number', 'ordinal number',
  'cardinal numeral', 'ordinal numeral',
  # Other headers in use.
  'personal pronoun', 'adjective/adverb', 'proper adjective', 'determiner',
  'demonstrative determiner', 'clitic', 'infix', 'counter', 'proverb',
  'expression', 'adjectival noun', 'quasi-adjective', 'particle',
  'infinitive particle', 'possessive adjective', 'verbal prefix',
  'postposition', 'prepositional article', 'phrasal verb', 'participle',
  'interrogative auxiliary verb', 'pronominal adverb', 'adnominal',
  'abstract pronoun', 'conjunction particle', 'root',
  # Non-standard, deprecated headers.
  'noun form', 'verb form', 'adjective form', 'nominal phrase',
  'noun phrase', 'verb phrase', 'transitive verb', 'intransitive verb',
  'reflexive verb', 'compounds',
  # Other headers seen.
  'definite article', 'demonstrative pronoun', 'indefinite article',
  'indefinite pronoun', 'indetermined pronoun', 'interrogative conjunction',
  'interrogative determiner', 'interrogative particle',
  'interrogative pronoun', 'legal expression', 'mass noun', 'noun and verb',
  'possessive determiner', 'possessive pronoun', 'prepositional phrase',
  'prepositional pronoun', 'reflexive pronoun', 'relative pronoun', 'saying',
  'shorthand', 'verbal noun'
])
# A dictionary that maps uncommon/incorrect section title to their canonical
# variants.
MEANING_RENAME = {
  'Noun 1': 'noun',
  'Noun 2': 'noun',
  'Idioms': 'idiom',
  'Number': 'numeral',
  'Numeral': 'numeral',
  'Cardinal number': 'numeral',
  'Ordinal number': 'numeral',
  'Cardinal numeral': 'numeral',
  'Ordinal numeral': 'numeral',
  'Noun form': 'noun',
  'Verb form': 'verb',
  'Adjective form': 'adjective',
  'Transitive verb': 'verb',
  'Intransitive verb': 'verb',
  'Reflexive verb': 'verb',
  'Derived expressions': 'derived expression'
}


def _getLinksInSection(page, section_regex):
  """Finds all terms linked in a given section of a page.

  Args:
    page: The raw textual content of the page.
    section_regex: The regex to use to find the desired section.

  Returns:
    A list of linked terms (strings).
  """
  links = []
  for title, content in section_regex.findall(page):
    content_lines = RE_BULLET_ITEM.findall(content)
    for line in content_lines:
      links += [i[0] for i in RE_INNER_LINK.findall(line)]
  return [i for i in links if ':' not in i]


def _formatLink(match):
  """Reformats a matched Wiki link.

  Terms are relinked with a simple HTML anchor tag. Special, interwiki and
  external links are unlinked. Category links are discarded. In all cases, the
  link text is calculated the same way as it is done by MediaWiki.

  Args:
    match: A match object as passed by the callback of re.sub.

  Returns:
    A replacement for the link - may be linked, unlinked or empty.
  """
  term, text, tail = [i or '' for i in match.groups()]
  if 'Category:' in term:
    return ''
  elif ':' in term:
    return text + tail
  else:
    escaped_term = urllib2.quote(term.encode('utf8')).decode('utf8')
    args = (escaped_term, (text or term) + tail)
    return ur'<a href="http://en.wiktionary.org/wiki/%s">%s</a>' % args


def _isExampleLine(line):
  """Determines whether a line looks like an example."""
  return RE_EXAMPLE_START.search(line) is not None


def _extractQualifiers(text):
  """Extracts (and removes) topic qualifiers from definitions.

  Args:
    text: The raw text which may contain topic qualifiers. Usually a definition.

  Returns:
    A tuple containing a string of extracted qualifiers inside a span with class
    "label" and the text with all qualifiers removed.
  """
  # Normalize commas inside qualifiers.
  text = text.replace(QUALIFIER_COMMA, ', ')

  # Extract all qualifiers.
  qualifiers = []
  last = None
  while text != last:
    last = text
    qualifiers += RE_QUALIFIER_CONTENT.findall(text)
    text = RE_QUALIFIER_TAG.sub('', text)
    # Fix qualifiers that are not in proper tags.
    text = RE_QUALIFIER_UNFORMATTED.sub(QUALIFIER_CONTENT, text)

  # Reformat the qualifiers.
  if qualifiers:
    qualifiers = [RE_TAG.sub('', i) for i in qualifiers]
    qualifiers = '<span class="label">' + ', '.join(qualifiers) + '</span> '
  else:
    qualifiers = ''

  return qualifiers, text


def _evalWikiMarkup(text):
  """Converts template-expanded wiki markup into clean(ish) HTML.

  Args:
    text: The raw (part of a) MediaWiki page that has undergone template
      expansion.

  Returns:
    A cleaned up HTML version of the page.
  """
  # Take care of simple emphasis and strong tags. Order matters!
  text = RE_STRONG.sub(r'<strong>\1</strong>', text)
  text = RE_EMPHASIS.sub(r'<em>\1</em>', text)

  # Remove spans which only add hover titles.
  text = RE_TITLED_TAG.sub(r'\1', text)

  # Strip deletion and verification requests.
  text = RE_REQUEST.sub('', text)

  # Remove inter-wiki links.
  parsed_html = beautifulsoup.BeautifulSoup(text)
  wikilinks = parsed_html.findAll(
      'div', attrs={'class': lambda x: x and 'sister-project' in x})
  for i in wikilinks: i.replaceWith('')
  text = parsed_html.renderContents().decode('utf8')
  text = RE_INTERPROJECT_LINK.sub('', text)

  # Evaluate links.
  text = RE_INNER_LINK.sub(_formatLink, text)
  text = RE_EXTERN_LINK.sub('', text)

  # Extract topic qualifiers.
  qualifiers, text = _extractQualifiers(text)

  # Put qualifiers back and get rid of all unrecognized tags.
  text = qualifiers + RE_TAG.sub('', text)

  # Remove duplicate quotes.
  text = text.replace(u'\u201c\u2018', u'\u201c')
  text = text.replace(u'\u2019\u201d', u'\u201d')

  # Remove extraneous spaces.
  text = RE_MULTISPACE.sub(' ', text).strip()

  # Fix unmatched emphasis wiki tags.
  if text.startswith("''") and "''" not in text[1:]:
    text = '<em>' + text[2:] + '</em>'

  return text


def parseAudio(page):
  """Extracts audio pronunciation links from a page.

  Args:
    page: The raw page content.

  Returns:
    A list of dictionaries, each containing 2 keys:
      file: Contains the filename of the audio file.
      type: Contains the type or region of pronunciation (US, UK, etc.). If no
        type could be found, this will be None.
  """
  audio_tags = []
  for audio_type, audio_file in RE_AUDIO_TAG.findall(page):
    audio_type = audio_type.replace('Canadian', 'CA').replace('CAN', 'CA')
    audio_type = RE_AUDIO_TYPE.findall(audio_type) or None
    audio_tags.append((audio_file, audio_type and audio_type[0]))

  return [{'file': i, 'type': j} for i, j in set(audio_tags)]


def parseIPA(page):
  """Extracts all IPA pronuncations from a page as strings."""
  return RE_IPA.findall(page)


def parseSynonyms(page):
  """Extracts all synonym terms from a page as strings."""
  return _getLinksInSection(page, RE_SYNONYM_SECTIONS)


def parseAntonyms(page):
  """Extracts all antonym terms from a page as strings."""
  return _getLinksInSection(page, RE_ANTONYM_SECTIONS)


def parseRelated(page):
  """Extracts all "related" terms from a page as strings."""
  return _getLinksInSection(page, RE_RELATED_SECTIONS)


def parseEtymology(page):
  """Extracts all etymology passages from a page as strings."""
  return [_evalWikiMarkup(j) for i, j in RE_ETYMOLOGY_SECTIONS.findall(page)
          if j and 'You can help Wiktionary by giving it' not in j]


def parseMeanings(page):
  """Extracts definitions (meanings) and their examples from a page.

  Args:
    page: The raw page content.

  Returns:
    A list of definitions as dictionaries, each containing 2 or 3 keys:
      type: The type of the word that this definition assumes. E.g. "verb".
      content: The actual definition text.
      examples: A list of example usages of the term using this sense.
  """
  meanings = []
  for title, content in RE_SECTION.findall(page):
    # Clean up title and ensure it is recognized.
    title = RE_INNER_LINK.sub(lambda m: m.group(2) or '', title)
    title = title.lower()
    if title not in MEANING_HEADERS: continue
    title = MEANING_RENAME.get(title, title)

    # Walk the lines taking each meaning with its examples on each iteration.
    lines = RE_NUMBERED_ITEM.findall(content)
    while lines:
      if _isExampleLine(lines[0]):
        # Orphan example. Skip.
        lines = lines[1:]
        continue

      # Get the basic definition.
      content = _evalWikiMarkup(lines[0])
      if not content.endswith('.'): content += '.'

      # Move on to the next line.
      lines = lines[1:]

      # Extract example lines belonging to this definition.
      examples = list(itertools.takewhile(_isExampleLine, lines))
      # Move past the extracted example lines.
      lines = lines[len(examples):]
      # Filter out invalid example lines.
      valid_examples = []
      for example in examples:
        if len(example.split()) > 1 and not example.startswith('* '):
          cleaned_example = RE_EXAMPLE_BREAK.findall(example)
          initial_year = RE_INIT_YEAR.search(example)
          if cleaned_example and cleaned_example[0] and not initial_year:
            valid_examples.append(_evalWikiMarkup(cleaned_example[0]))

      # Assemble the meaning dictionary.
      if content and len(content) > 3:
        meaning = {'type': title, 'content': content}
        if valid_examples:
          meaning['examples'] = valid_examples
        meanings.append(meaning)

  return meanings
