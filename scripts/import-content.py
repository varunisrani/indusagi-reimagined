import json,html,zipfile,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
SOURCE=Path('/workspace/indusagi-archive/original')
DEST=Path(__file__).resolve().parent.parent/'app'/'data'
class Cleaner(HTMLParser):
    allowed=set('p h1 h2 h3 h4 h5 h6 a ul ol li pre code blockquote strong em b i table thead tbody tr th td hr br img span div del s details summary kbd sup sub'.split())
    void={'br','hr','img'}
    def __init__(self):super().__init__(convert_charrefs=True);self.result=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in {'script','style','iframe','object'}:self.skip+=1;return
        if self.skip or tag not in self.allowed:return
        out={}
        for k,v in attrs:
            if k in {'id','title','alt','colspan','rowspan'}:out[k]=v
            if (tag=='a' and k=='href') or (tag=='img' and k=='src'):
                if not v or urlparse(v).scheme not in {'','https','http','mailto'}:continue
                if v.startswith('https://www.indusagi.com/') and k=='href':v=v[len('https://www.indusagi.com'):]
                elif v.startswith('/') and k=='src':v='https://www.indusagi.com'+v
                out[k]=v
        self.result.append('<'+tag+''.join(' '+k+'="'+html.escape(v or '',quote=True)+'"' for k,v in out.items())+'>')
    def handle_endtag(self,tag):
        if tag in {'script','style','iframe','object'}:self.skip=max(0,self.skip-1);return
        if not self.skip and tag in self.allowed and tag not in self.void:self.result.append('</'+tag+'>')
    def handle_data(self,data):
        if not self.skip:self.result.append(html.escape(data,quote=False))
docs={}
raw_records={}
for f in SOURCE.glob('*/content.json'):
    d=json.loads(f.read_text());raw_records[d['url']]=d
for f in (SOURCE.parent/'batches').glob('*.zip'):
    with zipfile.ZipFile(f) as z:
        for name in z.namelist():
            if name.endswith('/content.json'):
                d=json.loads(z.read(name));raw_records[d['url']]=d
for url,d in raw_records.items():
    p=urlparse(url).path
    if not d.get('html'):continue
    kind='documentation' if p.split('/')[1] in {'docs','cli','python','python-cli','rust','rust-cli'} else 'article'
    body=re.sub(r'<h1\b[^>]*>[\s\S]*?</h1>', '', d['html'],count=1) if kind=='article' else d['html']
    c=Cleaner();c.feed(body)
    docs[p]={'kind':kind,'title':d['title'],'html':''.join(c.result),'nav':d['nav'],'sections':[{'id':s['id'],'title':s['title']} for s in d['sections']]}
DEST.mkdir(exist_ok=True)
(DEST/'documents.json').write_text(json.dumps(docs,ensure_ascii=False,separators=(',',':')))
print('Imported',len(docs),'documentation routes')

# Keep the per-route runtime chunks aligned with the canonical import.
import subprocess
subprocess.run(["node", str(Path(__file__).with_name("split-documents.mjs"))], check=True)
