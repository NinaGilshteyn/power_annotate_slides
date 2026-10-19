"""Extract normalized word boxes for selectable PDF slide overlays."""
import argparse
import json
from pathlib import Path
import pdfplumber

def extract(pdf_path,ocr_path=None):
    ocr=json.loads(Path(ocr_path).read_text(encoding='utf-8-sig')) if ocr_path else None
    result={}
    with pdfplumber.open(pdf_path) as pdf:
        if ocr is not None and len(ocr)!=len(pdf.pages):
            raise ValueError('OCR page count must match the source PDF')
        for i,page in enumerate(pdf.pages):
            native=[dict(text=w['text'],x=w['x0']/page.width,y=w['top']/page.height,w=(w['x1']-w['x0'])/page.width,h=(w['bottom']-w['top'])/page.height,kind='pdf') for w in page.extract_words()]
            words=list(native)
            if ocr:
                data=ocr[i]
                for word in data['words']:
                    x=word['x']/data['width'];y=word['y']/data['height'];w=word['w']/data['width'];h=word['h']/data['height']
                    if w<=0 or h<=0:continue
                    def overlap(n):
                        return max(0,min(x+w,n['x']+n['w'])-max(x,n['x']))*max(0,min(y+h,n['y']+n['h'])-max(y,n['y']))/(w*h)
                    if not any(overlap(n)>.30 for n in native):
                        words.append(dict(text=word['text'],x=x,y=y,w=w,h=h,kind='ocr'))
            result[f'slide-{i+1}']=sorted(words,key=lambda w:(round(w['y']/.008),w['x']))
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf')
    parser.add_argument('--ocr-json')
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    data=extract(args.pdf,args.ocr_json)
    Path(args.output).write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
    print(f'{len(data)} pages; {sum(map(len,data.values()))} selectable words')
