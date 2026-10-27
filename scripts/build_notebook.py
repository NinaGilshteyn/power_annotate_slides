"""Populate the approved Power Annotate Deck shell without redesigning it."""
import argparse
import base64
import hashlib
import html
import json
from pathlib import Path
import re
import shutil

def safe_json(value):
    return json.dumps(value,ensure_ascii=False).replace('<','\\u003c')

def resolve_image(value,base):
    if not isinstance(value,str):raise ValueError('Slide image must be a path or image data URL')
    if re.fullmatch(r'data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+',value):return value
    path=(base/value).resolve()
    types={'.jpg':'jpeg','.jpeg':'jpeg','.png':'png','.webp':'webp'}
    if path.suffix.lower() not in types:raise ValueError('Use PNG, JPEG or WebP slide renders')
    return 'data:image/'+types[path.suffix.lower()]+';base64,'+base64.b64encode(path.read_bytes()).decode()

def build(input_path,output_path,words_path=None,state_path=None):
    input_path=Path(input_path).resolve();out=Path(output_path).resolve()
    if out==input_path:raise ValueError('Output must differ from the input manifest')
    if out.exists():raise ValueError('Output already exists. Preserve its saved state before upgrading; choose a new output path.')
    data=json.loads(input_path.read_text(encoding='utf-8-sig'))
    for key in ['title','filename','pages']:
        if key not in data:raise ValueError('Missing manifest field: '+key)
    if not isinstance(data['title'],str) or not data['title'].strip() or not isinstance(data['filename'],str):raise ValueError('Title and filename must be strings')
    pages=data['pages']
    if not isinstance(pages,list) or not pages:raise ValueError('At least one rendered slide is required')
    for i,page in enumerate(pages):
        page.setdefault('id',f'slide-{i+1}');page.setdefault('number',i+1);page.setdefault('title',f'Slide {i+1}');page.setdefault('text','')
        if not isinstance(page['id'],str) or page['id'] in ['__proto__','prototype','constructor']:raise ValueError('Invalid slide ID')
        if page['number']!=i+1:raise ValueError('Original slides must have consecutive numbers in source order')
        if any(not isinstance(page.get(k),(int,float)) or isinstance(page.get(k),bool) or not 0<page[k]<100000 for k in ['width','height']):raise ValueError('Provide positive rendered width and height')
        if not all(isinstance(page[k],str) for k in ['title','text']):raise ValueError('Slide title/text must be strings')
        page['image']=resolve_image(page.get('image',page.get('image_path')),input_path.parent)
    ids=[p['id'] for p in pages]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate slide IDs')
    data.setdefault('id',hashlib.sha256(safe_json({'filename':data['filename'],'pages':pages}).encode()).hexdigest())
    if not isinstance(data['id'],str) or not data['id']:raise ValueError('Provide a stable deck ID/checksum')
    data.setdefault('tag',re.sub(r'\s+','_',data['title'].strip()))
    data.setdefault('cards',[]);data.setdefault('pdf','');data.setdefault('original','')
    for i,card in enumerate(data['cards']):
        if card.get('pageId') not in ids:raise ValueError('Card must reference a source slide ID')
        card.setdefault('id',f'initial-{i+1}');card.setdefault('text','');card.setdefault('baseline',card['text']);card.setdefault('extra',data['title']+' · '+card['pageId']);card.setdefault('tags',data['tag']);card.setdefault('origin','Editable study draft');card.setdefault('saved',False)
        if not all(isinstance(card[k],str) for k in ['id','text','baseline','extra','tags','origin']):raise ValueError('Invalid card fields')
    words=json.loads(Path(words_path).read_text(encoding='utf-8-sig')) if words_path else data.pop('word_data',{})
    if not isinstance(words,dict) or any(k not in ids for k in words):raise ValueError('Word data must match this deck')
    for entries in words.values():
        if not isinstance(entries,list):raise ValueError('Word entries must be arrays')
        for w in entries:
            if not isinstance(w.get('text'),str) or any(not isinstance(w.get(k),(int,float)) or isinstance(w.get(k),bool) or not 0<=w[k]<=1 for k in ['x','y','w','h']):raise ValueError('Use normalized word coordinates in [0,1]')
            w.setdefault('kind','pdf')
    state=json.loads(Path(state_path).read_text(encoding='utf-8-sig')) if state_path else None
    if state and (state.get('schema')!=1 or state.get('deckId')!=data['id'] or any(p not in state.get('order',[]) for p in ids)):raise ValueError('Saved state does not match this deck')
    stem=re.sub(r'[^A-Za-z0-9 _.-]','',data['title']).strip(' .')[:100] or 'Study deck'
    source=data.pop('source_path',None)
    source_path=None
    if source:
        source_path=(input_path.parent/source).resolve()
        if not source_path.is_file():raise ValueError('Source attachment not found')
        data['original']=stem+' - Original'+source_path.suffix.lower()
        dest=out.parent/data['original']
        if dest.exists() and dest.read_bytes()!=source_path.read_bytes():raise ValueError('A different source attachment already has that output name')
    template=(Path(__file__).resolve().parent.parent/'assets'/'notebook-template.html').read_text(encoding='utf-8')
    replacements={
        '__DECK_JSON__':safe_json(data),'__WORD_JSON__':safe_json(words),'__STATE_JSON__':safe_json(state),
        '__HTML_TITLE__':html.escape(data['title']),'__SUBTITLE__':html.escape(data.get('subtitle',data['title'])),
        '__SLIDE_COUNT__':str(len(pages)),'__FILE_STEM__':stem,
        '__EXTRACTION_NOTICE__':html.escape(data.get('extraction_notice','Select mode supports on-slide text where word data is available. Verify extracted text and equations against the source image. Image-only text requires local OCR.')),
    }
    # One-pass substitution: source text that resembles a token remains source text.
    result=re.sub('|'.join(map(re.escape,replacements)),lambda m:replacements[m.group()],template)
    if not data.get('pdf') and not data.get('original'):
        result=result.replace('id="original" class="full"','id="original" class="full hidden"',1)
    result=result.replace('Download original PDF','Download original deck')
    out.parent.mkdir(parents=True,exist_ok=True)
    if source_path:
        dest=out.parent/data['original']
        if source_path!=dest:shutil.copy2(source_path,dest)
    out.write_text(result,encoding='utf-8')
    print(f'Created {out}: {len(pages)} slides using the approved canonical layout.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--words')
    parser.add_argument('--state')
    args=parser.parse_args()
    build(args.input,args.output,args.words,args.state)
