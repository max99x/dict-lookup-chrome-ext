from itertools import takewhile as _takewhile
from urllib2 import quote as _urlescape
import re

def _createSectionRegex(min_level, headers):
    template = r'''
        (?:^|\r|\n|\r\n)
        ={%(min_level)d,}
        (?:\{\{)?
        (%(headers)s)
        (?:\}\})?
        ={%(min_level)d,}
        \s*
        (?:^|\r|\n|\r\n)
        (.*?)
        (?:(?=(?:^|\r|\n|\r\n)=)|$)
    '''

    headers = '|'.join(re.escape(i) for i in headers)
    return re.compile(template % locals(),
                      re.VERBOSE | re.UNICODE | re.DOTALL | re.IGNORECASE)

RE_AUDIO_TAG = re.compile(r'<span class="unicode audiolink">&nbsp;\[\[:Media:([^|{}]*)\|([^|{}]*)\]\]</span>')
RE_AUDIO_TYPE = re.compile(r'[A-Z](?:[-/\\A-Z]*[A-Z])\b')
RE_IPA = re.compile(r'<span class="IPA">(/.*?/)</span>', re.UNICODE)
RE_BULLET_ITEMS = re.compile(r'^\*(.+)$', re.MULTILINE | re.UNICODE)
RE_HASH_LINES = re.compile(r'^#(.+)$', re.MULTILINE | re.UNICODE)
RE_EXAMPLE_START = re.compile(r'^([*#][:#*]?|:)')
RE_TAG = re.compile(r'<(?!/?(?:em|strong)>)[^>]*>|<em></em>|<strong></strong>')
RE_INNER_LINK = re.compile(r'\[\[(.+?)(?:\|.*?)?\]\]', re.UNICODE)
RE_STRONG = re.compile(r"'''(.*?)'''", re.UNICODE | re.DOTALL)
RE_EMPHASIS = re.compile(r"''(.*?)''", re.UNICODE | re.DOTALL)
RE_LINK = re.compile(r"\[\[(.*?)(?:\|(.*?))?\]\](\w*)", re.UNICODE)
RE_MULTISPACE = re.compile(r'[\s\xb6]{2,}', re.UNICODE)
RE_EXAMPLE_BREAK = re.compile(r'(?:^|(?<=[^\w<]))(?=[<\'"\w])(.+)', re.UNICODE)
RE_INIT_YEAR = re.compile(r"^(?:\W|<[^>]*>)*'''\d{4}'''", re.UNICODE)
RE_QUALIFIER_TAG = re.compile(r'<span class="qualifier-[^>"]*">.*?</span>', re.UNICODE | re.DOTALL)
RE_QUALIFIER_CONTENT = re.compile(r'<span class="qualifier-content">(.*?)</span>', re.UNICODE | re.DOTALL)
RE_QUALIFIER_UNFORMATTED = re.compile(r'^(\W*)(?:<em>)?\(([^()]+)\)(?:</em>)?', re.UNICODE | re.DOTALL)
RE_VERIFICATION_REQUEST = re.compile(r'<span style="color:#777777">.*?Requests_for_verification.*?</span>', re.UNICODE | re.DOTALL)

RE_SYNONYM_SECTIONS = _createSectionRegex(3, ['Synonyms'])
RE_ANTONYM_SECTIONS = _createSectionRegex(3, ['Antonyms'])
RE_ETYMOLOGY_SECTIONS = _createSectionRegex(3, ['Etymology', 'Etymology 1'])

RELATED_HEADERS = ['See also', 'Related terms', 'Derived terms',
                   'Coordinate terms', 'Troponyms', 'Alternative forms']
RE_RELATED_SECTIONS = _createSectionRegex(3, RELATED_HEADERS)

MEANING_HEADERS = [
    # Standard POS headers
    'Noun', 'Noun 1', 'Noun 2', 'Verb', 'Adjective', 'Adverb', 'Pronoun',
    'Conjunction', 'Interjection', 'Preposition', 'Proper Noun', 'Article',
    # Standard non-POS level 3 headers
    'Acronym', 'Abbreviation', 'Initialism', 'Contraction', 'Prefix', 'Suffix',
    'Symbol', 'Letter', 'Idiom', 'Idioms', 'Phrase',
    # Debated POS level 3 headers
    'Number', 'Numeral', 'Cardinal number', 'Ordinal number',
    'Cardinal numeral', 'Ordinal numeral',
    # Other headers in use
    'Personal pronoun', 'Adjective/Adverb', 'Proper adjective', 'Determiner',
    'Demonstrative determiner', 'Clitic', 'Infix', 'Counter', 'Proverb',
    'Expression', 'Adjectival noun', 'Quasi-adjective', 'Particle',
    'Infinitive particle', 'Possessive adjective', 'Verbal prefix',
    'Postposition', 'Prepositional article', 'Phrasal verb', 'Participle',
    'Interrogative auxiliary verb', 'Pronominal adverb', 'Adnominal',
    'Abstract pronoun', 'Conjunction particle', 'Root',
    # Non-standard, deprecated headers
    'Noun form', 'Verb form', 'Adjective form', 'Nominal phrase',
    'Noun phrase', 'Verb phrase', 'Transitive verb', 'Intransitive verb',
    'Reflexive verb', 'Compounds',
    # Other headers seen
    'Definite Article', 'Demonstrative pronoun', 'Indefinite article',
    'Indefinite Pronoun', 'Indetermined pronoun', 'Interrogative conjunction',
    'Interrogative determiner', 'Interrogative particle',
    'Interrogative pronoun', 'Legal expression', 'Mass noun', 'Noun and verb',
    'Possessive determiner', 'Possessive pronoun', 'Prepositional phrase',
    'Prepositional Pronoun', 'Reflexive pronoun', 'Relative pronoun', 'Saying',
    'Shorthand', 'Verbal noun'
]
MEANING_HEADERS = set(i.lower() for i in MEANING_HEADERS)
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
    'Derived expressions': 'Derived expression'
}
RE_SECTION = re.compile(r'''
    (?:^|\r|\n|\r\n)
    ={3,}
    ([^\n]*?)
    ={3,}
    \s*
    (?:^|\r|\n|\r\n)
    (.*?)
    (?:(?=(?:^|\r|\n|\r\n)=)|$)
''', re.VERBOSE | re.UNICODE | re.DOTALL | re.IGNORECASE)

def _getLinksInSection(page, section_regex):
    raw_sections = section_regex.findall(page)
    links = []
    for title, content in raw_sections:
        content_lines = RE_BULLET_ITEMS.findall(content)
        for line in content_lines:
            links += RE_INNER_LINK.findall(line)
    return [i for i in links if ':' not in i]

def _evalWikiMarkup(text):
    # Order matters!
    text = RE_STRONG.sub(r'<strong>\1</strong>', text)
    text = RE_EMPHASIS.sub(r'<em>\1</em>', text)

    def formatLink(match):
        if match.group(1).startswith(('w:', 'Appendix:Glossary', 'http:')):
            return match.group(2) or ''
        if ':' in match.group(1):
            return ''
        
        escaped_term = _urlescape(match.group(1).encode('utf8')).decode('utf8')
        if match.group(2):
            link_text = match.group(2)
        else:
            link_text = match.group(1) + match.group(3)
        return (r'<a href="http://en.wiktionary.org/wiki/%s">%s</a>' %
                (escaped_term, link_text))

    # Strip verification requests.
    text = RE_VERIFICATION_REQUEST.sub('', text)
    # Fix qualifiers that are not in proper tags.
    new_text = None
    while text != new_text:
        if new_text: text = new_text
        new_text = RE_QUALIFIER_UNFORMATTED.sub(r'\1<span class="qualifier-content">\2</span>', text)
    text = text.replace('<span class="ib-comma"><span class="qualifier-comma">,</span></span>', ', ')
    # Extract all qualifiers and reformat them.
    qualifiers = RE_QUALIFIER_CONTENT.findall(text)
    if qualifiers:
        qualifiers = [RE_TAG.sub('', i) for i in qualifiers]
        #qualifiers = filter(None, [RE_TAG.sub('', i) for i in qualifiers])
        qualifiers = '<span class="label">' + ', '.join(qualifiers) + '</span> '
    else:
        qualifiers = ''
    # Put qualifiers back and get rid of unnecessary tags.
    text = RE_QUALIFIER_TAG.sub('', text)
    text = RE_TAG.sub('', text)
    text = qualifiers + text
    # Evaluate links.
    text = RE_LINK.sub(formatLink, text)
    # Remove duplicate quotes.
    text = text.replace(u'\u201c\u2018', u'\u201c').replace(u'\u2019\u201d', u'\u201d')
    # Remove extraneous spaces.
    text = RE_MULTISPACE.sub(' ', text).strip()
    # Fix unmatched emphasis wiki tags.
    if text.startswith("''") and "''" not in text[1:]:
        text = '<em>' + text[2:] + '</em>'
    
    return text


def parseAudio(page):
    raw_audio_tags = RE_AUDIO_TAG.findall(page)
    audio_tags = []

    for audio_file, audio_type in raw_audio_tags:
        audio_type = audio_type.replace('Canadian', 'CA').replace('CAN', 'CA')
        audio_type = RE_AUDIO_TYPE.findall(audio_type) or None
        if audio_type:
            audio_type = audio_type[0]

        audio_tags.append((audio_file, audio_type))
    
    return [{'file': i, 'type': j} for i, j in set(audio_tags)]

def parseIPA(page):
    return RE_IPA.findall(page)

def parseSynonyms(page):
    return _getLinksInSection(page, RE_SYNONYM_SECTIONS)

def parseAntonyms(page):
    return _getLinksInSection(page, RE_ANTONYM_SECTIONS)

def parseRelated(page):
    return _getLinksInSection(page, RE_RELATED_SECTIONS)

def parseEtymology(page):
    return [_evalWikiMarkup(j) for i, j in RE_ETYMOLOGY_SECTIONS.findall(page)
            if 'You can help Wiktionary by giving it' not in j]

def parseMeanings(page):
    def isExampleLine(line):
        return RE_EXAMPLE_START.search(line) is not None
    
    raw_sections = RE_SECTION.findall(page)
    meanings = []
    for title, content in raw_sections:
        title = RE_LINK.sub(lambda m: m.group(2) or '', title)
        title = title.lower()
        if title not in MEANING_HEADERS: continue
        title = MEANING_RENAME.get(title, title)
        
        hash_lines = RE_HASH_LINES.findall(content)
        while hash_lines:
            if isExampleLine(hash_lines[0]):
                raise ValueError(u'Orphan example on page: ' + page)
            content = _evalWikiMarkup(hash_lines[0])
            if not content.endswith('.'): content += '.'
            hash_lines = hash_lines[1:]

            examples = list(_takewhile(isExampleLine, hash_lines))
            hash_lines = hash_lines[len(examples):]
            examples = [_evalWikiMarkup(RE_EXAMPLE_BREAK.findall(i)[0])
                        for i in examples
                        if (len(i.split()) > 1 and
                            RE_EXAMPLE_BREAK.search(i) and
                            not i.startswith('* ') and
                            not RE_INIT_YEAR.search(i))]
            examples = filter(None, examples)

            if content:
                meaning = {'type': title, 'content': content}
                if examples: meaning['examples'] = examples
                meanings.append(meaning)

    return meanings
