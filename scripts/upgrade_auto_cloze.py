"""Add the bundled offline Auto cloze control to an existing notebook in place."""
import argparse
import re
import shutil
from pathlib import Path

def upgrade(path):
    path=Path(path).resolve()
    if path.suffix.lower() not in {'.html','.htm'}:
        raise ValueError('Expected an HTML notebook')
    source=path.read_text(encoding='utf-8')
    if not re.search(r'cloze selected (?:words?|terms?)',source,re.I):
        raise ValueError('No recognized manual cloze control; inspect this notebook before adapting it.')
    close=list(re.finditer(r'</body\s*>',source,re.I))
    if not close:
        raise ValueError('No closing body tag')
    js=(Path(__file__).resolve().parent.parent/'assets'/'auto-cloze.js').read_text(encoding='utf-8')
    if re.search(r'</script',js,re.I):
        raise ValueError('Unsafe script terminator in asset')
    adapter='<script id="power-auto-cloze-adapter">\n'+js+'\n</script>'
    if 'id="power-auto-cloze-adapter"' in source:
        updated=re.sub(r'<script id="power-auto-cloze-adapter">.*?</script>',lambda _:adapter,source,count=1,flags=re.S)
    else:
        pos=close[-1].start()
        updated=source[:pos]+'\n'+adapter+'\n'+source[pos:]
    backup=path.with_suffix(path.suffix+'.bak')
    n=1
    while backup.exists():
        backup=path.with_suffix(path.suffix+f'.bak{n}')
        n+=1
    shutil.copy2(path,backup)
    path.write_text(updated,encoding='utf-8')
    print(f'Updated: {path}\nBackup: {backup}\nVerify the visible button in a blank card draft.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('notebook')
    args=parser.parse_args()
    upgrade(args.notebook)
