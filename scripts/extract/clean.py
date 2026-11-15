import json,re
d=json.load(open('/root/book/out/raw.json'))
END=re.compile(r'[.!?:”"’)\]]\s*$')
def merge(blocks):
    out=[]
    for b in blocks or []:
        if b['kind'] in('p','info','direction') and out and out[-1]['kind']==b['kind']:
            prev=out[-1]['text']
            if b['kind']=='info' or not END.search(prev) or (b['text'][:1].islower()):
                sep='' if prev.endswith('-') else ' '
                out[-1]['text']=(prev[:-1] if prev.endswith('-') else prev)+sep+b['text']; continue
        out.append(dict(b))
    for b in out:
        b['text']=re.sub(r'\s+',' ',b['text']).strip()
        b['text']=re.sub(r'(\d)to (\d)',r'\1 to \2',b['text'])
    return out
for w in d['walks']:
    w['blocks']=merge(w.get('blocks'))
    for st in w['stops']: st['blocks']=merge(st.get('blocks'))
json.dump(d,open('/root/book/out/clean.json','w'),ensure_ascii=False,indent=1)
w=d['walks'][0]
for b in w['blocks']: print('INTRO',b['kind'],b['text'][:150])
for st in w['stops'][:4]:
    print('##',st['n'],st['title'],st.get('subtitle'),[i['file'] for i in st.get('images',[])])
    for b in st['blocks']: print('  ',b['kind'],b['text'][:200])
