'''
Redirects various forms of words (conjugations, tenses, plurals) to their
parent words. The redirection is a simple copy to keep querying simple.
'''


import MySQLdb
import json
import re
import collections

RE_ALTERNATE_FORM = re.compile(r'''
.{,80}
\s
(?:
   form
  |
   plural
  |
   present\sparticiple
  |
   simple\spast
  |
   past\sparticiple)
\sof\s
<a\shref="http://en\.wiktionary\.org/wiki/([^>"]+)">
  [^<>]*
</a>
\s*
(?:\.\s*)?
''', re.VERBOSE | re.DOTALL | re.IGNORECASE)

def iterCursor(cursor):
    item = cursor.fetchone()
    while item is not None:
        yield item
        item = cursor.fetchone()

def getRedirectTarget(meaning):
    target = RE_ALTERNATE_FORM.match(meaning)
    return target and target.group(1)

if __name__ == '__main__':
    with MySQLdb.connect(host='localhost', user='root', passwd='',
                         db='dictionary', charset='utf8') as cursor:
        # Collect redirects.
        redirects = collections.defaultdict(list)
        cursor.execute('SELECT * FROM lookup')
        for row in iterCursor(cursor):
            word = unicode(row[0], 'utf8')
            text = json.loads(row[1])
            if 'meanings' not in text: continue
            meanings = [i['content'] for i in text['meanings']]
            
            targets = []
            for meaning in meanings:
                target = getRedirectTarget(meaning)
                if target is None:
                    break
                else:
                    targets.append(target)
                    
            if len(set(targets)) == 1:
                redirects[targets[0]].append(word)
            
        # Apply redirects.
        for target, sources in redirects.iteritems():
            cursor.executemany('''UPDATE lookup AS dst, lookup AS src
                                  SET dst.text = src.text
                                  WHERE src.name = %s AND dst.name = %s''',
                               [(target, i)for i in sources])
