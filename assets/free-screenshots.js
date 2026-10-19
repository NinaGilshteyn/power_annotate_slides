// Screenshots are page-anchored objects on original and inserted slides.
S.pastedImages??={};
let selectedScreenshot=null,screenshotDrag=null;
const screenshotLayer=el('div','screenshot-layer');screenshotLayer.id='screenshotLayer';$('slide').append(screenshotLayer);
function screenshotPosition(src,index=0){return new Promise(resolve=>{const im=new Image();im.onload=()=>{const rect=$('slide').getBoundingClientRect(),aspect=rect.width/rect.height;let w=.42,h=w*aspect*im.naturalHeight/im.naturalWidth;if(h>.78){w*=.78/h;h=.78}resolve({x:Math.min(.07+index*.035,.45),y:Math.min(.07+index*.035,.45),w,h});};im.onerror=()=>resolve({x:.07,y:.07,w:.42,h:.3});im.src=src;});}
async function migrateReferenceImages(){
  for(const [id,p]of Object.entries(S.refs)){if(p.freeImagesMigrated)continue;const arr=S.pastedImages[id]??=[];for(const src of p.images||[]){arr.push({id:uid(),src,...await screenshotPosition(src,arr.length)});}p.freeImagesMigrated=true;}
  touch();renderScreenshots();
}
function renderScreenshots(){
  S.pastedImages??={};
  screenshotLayer.replaceChildren();
  for(const item of S.pastedImages[S.active]||[]){
    const box=el('div','screenshot-object'+(selectedScreenshot===item.id?' selected':''));box.dataset.imageId=item.id;box.tabIndex=0;box.setAttribute('aria-label','Pasted screenshot. Drag to move; use the corner handle to resize.');box.style.left=item.x*100+'%';box.style.top=item.y*100+'%';box.style.width=item.w*100+'%';box.style.height=item.h*100+'%';
    const im=el('img');im.src=item.src;im.alt='Pasted screenshot';im.draggable=false;box.append(im);
    const grip=el('button','screenshot-resize','↘');grip.type='button';grip.title='Drag to resize screenshot';grip.setAttribute('aria-label','Resize screenshot');box.append(grip);
    const remove=el('button','screenshot-remove','×');remove.type='button';remove.title='Remove screenshot';remove.setAttribute('aria-label','Remove screenshot');remove.onclick=e=>{e.stopPropagation();S.pastedImages[S.active]=S.pastedImages[S.active].filter(i=>i.id!==item.id);selectedScreenshot=null;touch();renderScreenshots();};box.append(remove);
    box.onpointerdown=e=>{
      if(e.target===remove)return;
      if(tool!=='read')return;
      e.stopPropagation();e.preventDefault();selectedScreenshot=item.id;
      for(const b of screenshotLayer.children)b.classList.toggle('selected',b===box);
      box.focus({preventScroll:true});
      screenshotDrag={item,box,pageId:S.active,resize:e.target===grip,startX:e.clientX,startY:e.clientY,initial:{x:item.x,y:item.y,w:item.w,h:item.h},rect:$('slide').getBoundingClientRect()};box.setPointerCapture(e.pointerId);
    };
    box.onpointermove=e=>{const d=screenshotDrag;if(!d||d.box!==box)return;const dx=(e.clientX-d.startX)/d.rect.width,dy=(e.clientY-d.startY)/d.rect.height;
      if(d.resize){const factor=Math.max(0.12,1+Math.max(dx/d.initial.w,dy/d.initial.h));const cap=Math.min((1-d.item.x)/d.initial.w,(1-d.item.y)/d.initial.h);const ratio=Math.min(factor,cap);item.w=d.initial.w*ratio;item.h=d.initial.h*ratio;}else{item.x=Math.max(0,Math.min(1-item.w,d.initial.x+dx));item.y=Math.max(0,Math.min(1-item.h,d.initial.y+dy));}
      box.style.left=item.x*100+'%';box.style.top=item.y*100+'%';box.style.width=item.w*100+'%';box.style.height=item.h*100+'%';
    };
    function finish(e){if(screenshotDrag?.box===box){screenshotDrag=null;touch();}}
    box.onpointerup=finish;box.onpointercancel=finish;
    box.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const step=e.shiftKey?.03:.005;if(e.key==='ArrowLeft')item.x=Math.max(0,item.x-step);if(e.key==='ArrowRight')item.x=Math.min(1-item.w,item.x+step);if(e.key==='ArrowUp')item.y=Math.max(0,item.y-step);if(e.key==='ArrowDown')item.y=Math.min(1-item.h,item.y+step);touch();box.style.left=item.x*100+'%';box.style.top=item.y*100+'%';};
    screenshotLayer.append(box);
  }
}
renderReference=function(){const p=page();$('reference').replaceChildren();$('reference').tabIndex=0;if(p.title&&p.title!=='Reference notes')$('reference').append(el('h2','',p.title));if(p.citation)$('reference').append(el('p','small',p.citation));if(p.text)$('reference').append(el('div','',p.text));};
addImage=async function(file,targetId=S.active){
  if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>20e6){say('Use a PNG, JPEG, or WebP image under 20 MB.');return;}
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const geometry=await screenshotPosition(data,(S.pastedImages[targetId]||[]).length);const item={id:uid(),src:data,...geometry};(S.pastedImages[targetId]??=[]).push(item);selectedScreenshot=item.id;touch();if(S.active===targetId){setTool('read');renderScreenshots();}
};
async function pasteFromClipboard(){const id=S.active;try{if(!navigator.clipboard?.read)throw Error('Unavailable');const items=await navigator.clipboard.read();let count=0;for(const item of items){const type=item.types.find(t=>/^image\/(png|jpeg|webp)$/.test(t));if(type){const blob=await item.getType(type);await addImage(new File([blob],'screenshot.'+type.split('/')[1],{type}),id);count++;}}if(!count)say('Copy a screenshot first, then press Ctrl+V on the slide.');}catch(e){$('slide').focus({preventScroll:true});say('Press Ctrl+V to paste a screenshot, or use Add screenshot.');}}
document.addEventListener('paste',async e=>{
  if(document.querySelector('dialog[open]'))return;
  const files=Array.from(e.clipboardData?.items||[]).filter(i=>i.kind==='file'&&i.type.startsWith('image/')).map(i=>i.getAsFile()).filter(Boolean),id=S.active;
  if(files.length){e.preventDefault();e.stopImmediatePropagation();try{for(const file of files)await addImage(file,id);}catch(err){say('Could not paste this image. Try Add screenshot.');}return;}
  if(page().number||e.target.closest('input,textarea,[contenteditable]'))return;
  const text=e.clipboardData?.getData('text/plain');if(text){e.preventDefault();page().text+=(page().text?'\n\n':'')+text;touch();renderReference();$('refText').value=page().text;$('transcript').textContent=page().text;renderNav();}
},true);
$('slide').tabIndex=0;
$('slide').addEventListener('dragover',e=>{if(Array.from(e.dataTransfer.types).includes('Files'))e.preventDefault();});
$('slide').addEventListener('drop',async e=>{e.preventDefault();const id=S.active;for(const file of Array.from(e.dataTransfer.files))await addImage(file,id);});
const imageControls=el('div','row'),pasteButton=el('button','','Paste screenshot'),fileLabel=el('label','filelabel','Add screenshot'),fileInput=el('input');pasteButton.id='pasteAnyScreenshot';pasteButton.onclick=pasteFromClipboard;fileInput.type='file';fileInput.accept='image/png,image/jpeg,image/webp';fileInput.hidden=true;fileInput.onchange=async()=>{if(fileInput.files[0])await addImage(fileInput.files[0]);fileInput.value='';};fileLabel.append(fileInput);imageControls.id='screenshotControls';imageControls.append(pasteButton,fileLabel);$('stickyList').before(imageControls);
const referenceFileHandler=$('refImage').onchange;
const renderBeforeScreenshots=render;render=function(){renderBeforeScreenshots();renderScreenshots();};
const snapshotBeforeScreenshots=snapshot;snapshot=function(){const result=snapshotBeforeScreenshots();const doc=new DOMParser().parseFromString(result,'text/html');doc.getElementById('screenshotLayer')?.remove();doc.getElementById('screenshotControls')?.remove();return '<!doctype html>\n'+doc.documentElement.outerHTML;};
const importBeforeScreenshots=validImport;validImport=function(x){importBeforeScreenshots(x);if(x.pastedImages){if(typeof x.pastedImages!=='object'||Array.isArray(x.pastedImages))throw Error('Invalid pasted screenshots');for(const [id,images]of Object.entries(x.pastedImages)){if(!x.order.includes(id)||!Array.isArray(images)||images.length>500)throw Error('Invalid screenshot page');for(const im of images){if(typeof im.id!=='string'||typeof im.src!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(im.src)||![im.x,im.y,im.w,im.h].every(Number.isFinite)||im.x<0||im.y<0||im.w<=0||im.h<=0||im.x+im.w>1.001||im.y+im.h>1.001)throw Error('Invalid screenshot geometry');}}}return true;};
queueMicrotask(migrateReferenceImages);
