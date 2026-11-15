import pymupdf as fitz, glob, json, re, sys, os
OUT='/root/book/out_tmp'
OVER={}
files=[glob.glob(f'/root/book/part{i}*.pdf')[0] for i in (1,2,3)]
ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
walks=[]; front=[]; cur=None; stop=None
def target():
    return stop if stop is not None else (cur if cur is not None else None)
def add_para(text,kind):
    t=target()
    if t is None:
        front.append({'kind':kind,'text':text}); return
    t.setdefault('blocks',[]).append({'kind':kind,'text':text})
imgcount=0
for fi,f in enumerate(files):
    d=fitz.open(f)
    for pno,pg in enumerate(d):
        page_ref=f'p{fi+1}-{pno+1}'
        dct=pg.get_text('dict')
        for b in dct['blocks']:
            if b['type']==1:  # image
                w,h=b['width'],b['height']
                bw=b['bbox'][2]-b['bbox'][0]
                if bw<80: continue
                t=target()
                imgcount+=1
                name=f'{page_ref}-{imgcount}.jpg'
                clip=fitz.Rect(b['bbox'])&pg.rect
                if clip.width<80 or clip.height<60: imgcount-=1; continue
                pix=pg.get_pixmap(clip=clip,dpi=150)
                from PIL import Image, ImageStat
                im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples) if pix.n==3 else Image.frombytes('RGBA',(pix.width,pix.height),pix.samples).convert('RGB')
                st=ImageStat.Stat(im.convert('L'))
                if st.stddev[0]<18: imgcount-=1; continue
                if clip.width>pg.rect.width*0.95 and clip.height>pg.rect.height*0.9: imgcount-=1; continue
                area=clip.width*clip.height; cov=0
                for tb in dct['blocks']:
                    if tb['type']!=0: continue
                    for ln in tb['lines']:
                        for sp in ln['spans']:
                            if sp['text'].strip() and sp['size']>=6:
                                r=fitz.Rect(sp['bbox'])&clip
                                if not r.is_empty: cov+=r.width*r.height
                OVER[name]=round(cov/area,4)
                im.thumbnail((1200,1200)); im.save(f'{OUT}/img/{name}',quality=82)
                w,h=im.size
                rec={'file':name,'w':w,'h':h,'page':page_ref}
                if t is None: front.append({'kind':'image',**rec})
                else: t.setdefault('images',[]).append(rec)
                continue
            # text block: classify per line, merge consecutive same-kind lines
            groups=[]
            for l in b['lines']:
                txt=''.join(s['text'] for s in l['spans'])
                if not txt.strip(): continue
                s=max(l['spans'],key=lambda s:len(s['text'].strip()))
                size,font=round(s['size'],1),s['font']
                if size>=25: k='title'
                elif 'Bold' in font and not font.startswith('Helvetica') and 'Italic' not in font and 10.5<=size<=13 and re.match(r'^\s*\d{1,2}\s+\S',txt): k='stop'
                elif 'Bold' in font and font.startswith('ACaslon') and 'Italic' not in font and s['color']==0x5f6f38: k='stopsub'
                elif ('Semibold' in font) or ('Bold' in font and font.startswith('ACaslon') and 'Italic' not in font and 10.5<=size<=13): k='direction'
                elif font.startswith('HelveticaNeue') and size<=8: k='skip'
                elif font.startswith('Palatino') and size<9: k='skip'
                elif font.startswith('ACaslonPro-BoldItalic'): k='tagline'
                elif font.startswith('Helvetica') and 'Bold' in font: k='info'
                elif 'Italic' in font: k='caption' if size<10.5 else 'p'
                elif font.startswith('ACaslon') and size>=13: k='heading'
                else: k='p'
                if groups and groups[-1][0]==k and k not in ('stop',): groups[-1][1].append(txt)
                else: groups.append([k,[txt]])
            for k,ls in groups:
                text=re.sub(r'\s+',' ',' '.join(ls)).strip()
                text=re.sub(r'(\w)- (\w)',r'\1\2',text)
                if k=='skip' or not text: continue
                if re.fullmatch(r'[0-9ivxlc]+',text): continue
                if k=='title':
                    m=re.match(r'Walk ([IVX]+):\s*(.*)',text)
                    if m and m.group(1) in ROMAN and not any(w['roman']==m.group(1) for w in walks):
                        cur={'roman':m.group(1),'num':ROMAN.index(m.group(1))+1,'title':m.group(2).strip(),'page':page_ref,'stops':[]}
                        walks.append(cur); stop=None
                    elif cur is not None and m and m.group(1)==cur['roman'] and len(cur['title'])<40 and page_ref==cur['page']:
                        pass
                    continue
                if k=='stop' and cur is not None:
                    m=re.match(r'^(\d{1,2})\s+(.+)$',text)
                    stop={'n':int(m.group(1)),'title':m.group(2).strip(),'page':page_ref}
                    cur['stops'].append(stop); continue
                if k=='stopsub':
                    if stop is not None and 'subtitle' not in stop and len(text)<60: stop['subtitle']=text; continue
                    k='direction'
                if k=='stop': k='p'
                add_para(text,k)
json.dump(OVER,open('/root/book/out/overlay.json','w'))
json.dump({'walks':walks,'front':front},open(f'{OUT}/raw.json','w'),ensure_ascii=False,indent=1)
for w in walks:
    ns=[s['n'] for s in w['stops']]
    print(w['roman'],w['title'],len(ns),'stops; imgs',sum(len(s.get('images',[])) for s in w['stops'])+len(w.get('images',[])))
    print('   ',ns)
print('front blocks',len(front),'images',imgcount)
