// Direct on-slide selection, deck position, and one-time milestones.
const wordData=JSON.parse($('deck-word-data').textContent);
const textLayer=el('div','pdf-text-layer');textLayer.id='pdfTextLayer';textLayer.setAttribute('aria-label','Selectable slide text; diagram text may be OCR');$('slideImage').after(textLayer);
let measuredPage=null,wordMeasure=document.createElement('canvas').getContext('2d');
function fitSlideText(){const r=$('slideImage').getBoundingClientRect();if(!r.width||!r.height)return;for(const span of textLayer.children){const w=span._word,font=r.height*w.h*.90;span.style.fontSize=font+'px';wordMeasure.font=font+'px Arial';const natural=wordMeasure.measureText(w.text).width||1;span.style.transform='scaleX('+r.width*w.w/natural+')';}}
function mountSlideText(){const p=page();textLayer.classList.toggle('hidden',!p.number);if(!p.number)return;if(measuredPage===p.id){fitSlideText();return}measuredPage=p.id;textLayer.replaceChildren();for(const w of wordData[p.id]||[]){const span=el('span','',w.text+' ');span._word=w;span.dataset.kind=w.kind;span.style.left=w.x*100+'%';span.style.top=w.y*100+'%';span.style.height=w.h*100+'%';span.title=w.kind==='ocr'?'OCR text — verify against the slide':'';textLayer.append(span)}requestAnimationFrame(fitSlideText);}
new ResizeObserver(fitSlideText).observe($('slide'));$('slideImage').addEventListener('load',fitSlideText);
const meter=el('div','deck-progress-wrap'),track=el('div','deck-progress-track'),fill=el('div','deck-progress-fill'),meterLabel=el('span','deck-progress-label');meter.id='deckProgress';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Current position in original slide deck');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(D.pages.length));track.append(fill);meter.append(track,meterLabel);$('main').querySelector('.topbar').append(meter);
let currentOriginal=null,milestoneTimer=null;
function showMilestone(message){
  let overlay=$('milestone');if(!overlay){overlay=el('div');overlay.id='milestone';overlay.setAttribute('role','status');document.body.append(overlay)}clearTimeout(milestoneTimer);overlay.replaceChildren();const card=el('div','milestone-message',message),close=el('button','','Keep going ♥');close.onclick=()=>overlay.remove();card.append(close);overlay.append(card);
  const colors=['#b69aef','#77d9cc','#e896bf','#c18ee8','#8fd7ae'];const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  for(let i=0;i<(reduced?8:65);i++){const heart=el('span','heart-confetti','♥');heart.setAttribute('aria-hidden','true');heart.style.left=(Math.random()*100)+'%';heart.style.setProperty('--heart',colors[i%colors.length]);heart.style.setProperty('--size',(16+Math.random()*23)+'px');heart.style.setProperty('--duration',(3+Math.random()*2)+'s');heart.style.setProperty('--delay',(Math.random()*.8)+'s');heart.style.setProperty('--drift',(-130+Math.random()*260)+'px');heart.style.setProperty('--spin',(-300+Math.random()*600)+'deg');overlay.append(heart)}
  milestoneTimer=setTimeout(()=>overlay.remove(),6500);
}
function deckStudyProgress(){
  const p=page(),index=S.order.indexOf(S.active);let number=p.number;
  if(!number){for(let i=index-1;i>=0;i--){if(page(S.order[i]).number){number=page(S.order[i]).number;break}}number??=0}
  const ratio=number/D.pages.length;fill.style.width=ratio*100+'%';fill.style.boxShadow='0 0 '+(3+ratio*20)+'px '+(ratio*7)+'px rgba(167,117,242,'+(.15+ratio*.55)+')';meterLabel.textContent=number+' / '+D.pages.length+' · '+Math.round(ratio*100)+'%';track.setAttribute('aria-valuenow',String(number));
  if(!p.number)return;
  const milestones=S.deckMilestones??={half:false,complete:false};const half=Math.ceil(D.pages.length/2);
  if(p.number!==currentOriginal){currentOriginal=p.number;if(p.number===D.pages.length&&!milestones.complete){milestones.complete=true;touch();showMilestone('You made it! Way to go big dawg!')}else if(p.number===half&&!milestones.half){milestones.half=true;touch();showMilestone("you are half way! Don't turn back")}}
}
const renderBeforeStudy=render;render=function(){renderBeforeStudy();mountSlideText();deckStudyProgress();};
const snapshotBeforeStudy=snapshot;snapshot=function(){const result=snapshotBeforeStudy();const doc=new DOMParser().parseFromString(result,'text/html');doc.getElementById('pdfTextLayer')?.remove();doc.getElementById('deckProgress')?.remove();doc.getElementById('milestone')?.remove();return '<!doctype html>\n'+doc.documentElement.outerHTML;};
