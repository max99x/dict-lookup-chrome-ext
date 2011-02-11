"""Redirects conjugated words to their canonical lemmas.

Redirections include conjugations, tenses and plurals. The redirection is a
simple copy to keep querying simple.
"""


import json
import re
import collections


#TODO: Try enjoyed, abdicating.
# A regex to find the canonical term in a definition of a related term.
RE_ALTERNATE_FORM = re.compile(r'''
.{,80}
\s
(?:
   form
  |
   plural
  |
   present \s+ participle
  |
   simple \s+ past
  |
   past \s+ participle)
\s+ of \s+
<a \s+ href="http://en\.wiktionary\.org/wiki/([^>"]+?)(?:%23[^"]*)?">
  [^<>]*
</a>
\s*
(?:\.\s*)?
''', re.VERBOSE | re.DOTALL | re.IGNORECASE)
# The SQL query used to apply a redirect from one term to another.
REDIRECT_QUERY = '''
  UPDATE lookup AS dst, lookup AS src
  SET dst.text = src.text
  WHERE src.name = %s AND dst.name = %s
'''


def Canonize(cursor):
  # Collect redirects.
  redirects = collections.defaultdict(list)

  cursor.execute('SELECT * FROM lookup')
  for row in cursor:
    word = row[0]
    text = json.loads(row[1])
    if 'meanings' not in text: continue
    meanings = [i['content'] for i in text['meanings']]

    # Make sure all the meanings of this word refer to the same parent word.
    targets = set()
    for meaning in meanings:
      target = RE_ALTERNATE_FORM.match(meaning)
      if target is None:
        targets.clear()
        break
      else:
        targets.add(target.group(1))

    if len(targets) == 1:
      redirects[targets.pop().encode('utf8')].append(word)

  # Apply redirects.
  for target, sources in redirects.iteritems():
    cursor.executemany(REDIRECT_QUERY, [(target, i)for i in sources])
