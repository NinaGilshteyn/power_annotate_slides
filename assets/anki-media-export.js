// Offline TSV + media export. Anki references files in collection.media by filename.
function ankiHTML(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\r\n?|\n/g,'<br>');}
function zipStore(entries){
  const enc=new TextEncoder(),locals=[],directory=[];let offset=0;
  const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?(0xedb88320^(n>>>1)):(n>>>1);return n>>>0;});
  function crc32(bytes){let c=0xffffffff;for(const v of bytes)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  for(const entry of entries){const name=enc.encode(entry.name),data=typeof entry.data==='string'?enc.encode(entry.data):entry.data,crc=crc32(data);if(data.length>0xffffffff||offset>0xffffffff)throw Error('Export exceeds ZIP size limit');
    const head=new Uint8Array(30+name.length),h=new DataView(head.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);head.set(name,30);locals.push(head,data);
    const central=new Uint8Array(46+name.length),v=new DataView(central.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint16(14,0x21,true);v.setUint32(16,crc,true);v.setUint32(20,data.length,true);v.setUint32(24,data.length,true);v.setUint16(28,name.length,true);v.setUint32(42,offset,true);central.set(name,46);directory.push(central);offset+=head.length+data.length;
  }
  const end=new Uint8Array(22),v=new DataView(end.buffer),size=directory.reduce((n,x)=>n+x.length,0);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...locals,...directory,end],{type:'application/zip'});
}
function prepareAnkiMediaExport(){
  const valid=S.cards.filter(c=>c.saved&&cardValid(c)),media=new Map(),missing=[];
  if(!valid.length)throw Error('Save at least one valid card before exporting.');
  const deckPrefix='pa_'+D.id.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,24);
  function imageFile(src,base){const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(src||'');if(!m)return null;const ext=m[1]==='jpeg'?'jpg':m[1],name=base+'.'+ext;if(!media.has(name)){const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));media.set(name,bytes)}return name;}
  const rows=valid.map(c=>{const p=page(c.pageId);let extra=ankiHTML(c.extra),images=[];
    if(p?.number){const name=imageFile(p.image,deckPrefix+'_slide_'+String(p.number).padStart(3,'0'));if(name)images.push({name,label:'Original slide '+p.number});}
    else if(p){for(const [i,src]of(p.images||[]).entries()){const name=imageFile(src,deckPrefix+'_reference_'+String(p.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)+'_'+(i+1));if(name)images.push({name,label:'Reference page image '+(i+1)});}}
    if(!images.length)missing.push(c.id);
    for(const image of images)extra+='<br><br><div>'+ankiHTML(image.label)+'</div><img src="'+image.name+'" alt="'+ankiHTML(image.label)+'" style="max-width:100%;height:auto;">';
    return [ankiHTML(c.text),extra,c.tags].map(field).join('\t');
  });
  const tsv='#separator:Tab\n#html:true\n#notetype:Cloze\n#tags column:3\n#columns:Text\tExtra\tTags\n'+rows.join('\n')+'\n';
  const instructions='ANKI IMPORT - CARDS WITH SLIDE PICTURES\n\n1. Extract this ZIP.\n2. Open your Anki profile folder and collection.media. Copy the FILES inside media/ into collection.media. Do not copy the media folder itself or add subfolders there.\n3. In Anki, import cards.tsv using the Cloze note type. Enable Allow HTML in fields if it is not already enabled.\n4. Map column 1 to Text, column 2 to Extra (or Back Extra, whichever your Cloze template displays on the answer side), and column 3 to Tags.\n5. Preview a card answer. The source slide picture should appear below the explanation. If your custom back template does not display Extra/Back Extra, add that field to the answer template.\n\n'+valid.length+' saved notes; '+media.size+' unique image files; '+(S.cards.length-valid.length)+' drafts skipped; '+missing.length+' saved notes without an available source image.\n\nPictures are original source-slide renders or inserted reference images, without your drawing/note overlays. Multiple cards from the same slide share one media file. No content was uploaded.\n';
  return {entries:[{name:'cards.tsv',data:tsv},{name:'IMPORT INSTRUCTIONS.txt',data:instructions},...Array.from(media,([name,data])=>({name:'media/'+name,data}))],notes:valid.length,media:media.size,missing:missing.length,skipped:S.cards.length-valid.length};
}
exportTSV=function(){try{const pack=prepareAnkiMediaExport();download(zipStore(pack.entries),'Anki - Cards and slide pictures.zip');say(pack.notes+' notes and '+pack.media+' images exported. Extract the ZIP and follow IMPORT INSTRUCTIONS.txt.'+(pack.missing?' '+pack.missing+' notes have no available image.':''));}catch(e){say('Export: '+e.message);}};
$('exportCards').textContent='Export cards + slide pictures';
$('exportCards').title='Downloads a ZIP with Anki TSV, source images, and import instructions';
