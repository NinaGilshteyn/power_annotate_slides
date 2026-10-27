"""Add bulk card selection, source-slide tags and slide filters to a canonical notebook."""
from pathlib import Path
import argparse,re,shutil

def upgrade(path,output=None):
    path=Path(path).resolve();out=Path(output).resolve() if output else path
    text=path.read_text(encoding='utf-8')
    for marker in ['function renderCards(',"$('cardsList')",'// Controls\n']:
        if marker not in text:raise ValueError('This notebook needs a runtime-specific adapter: missing '+marker)
    skill=Path(__file__).resolve().parent.parent
    script=(skill/'assets'/'card-library.js').read_text(encoding='utf-8')
    css=(skill/'assets'/'card-library.css').read_text(encoding='utf-8')
    if '// BEGIN POWER ANNOTATE CARD LIBRARY v1' in text:
        text=re.sub(r'// BEGIN POWER ANNOTATE CARD LIBRARY v1.*?// END POWER ANNOTATE CARD LIBRARY v1',lambda _:script.strip(),text,count=1,flags=re.S)
    else:
        text=text.replace('// Controls\n',script+'\n// Controls\n',1)
    style='<style id="card-library-style">\n'+css+'\n</style>'
    if 'id="card-library-style"' in text:
        text=re.sub(r'<style id="card-library-style">.*?</style>',lambda _:style,text,count=1,flags=re.S)
    else:text=text.replace('</head>',style+'\n</head>',1)
    if out==path:
        backup=path.with_name(path.stem+'.before-card-library-update'+path.suffix);i=1
        while backup.exists():backup=path.with_name(path.stem+f'.before-card-library-update-{i}'+path.suffix);i+=1
        shutil.copy2(path,backup);print('Backup:',backup)
    elif out.exists():raise ValueError('Output already exists; choose a new path')
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(text,encoding='utf-8')
    print('Updated:',out)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('notebook');p.add_argument('--output');a=p.parse_args();upgrade(a.notebook,a.output)
