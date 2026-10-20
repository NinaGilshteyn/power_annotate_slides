S.viewVisibility??={progress:true,slides:true};
const viewButtons=el('div','view-visibility-buttons');viewButtons.id='viewVisibilityButtons';
const progressToggle=el('button'),slidesToggle=el('button');progressToggle.type=slidesToggle.type='button';progressToggle.id='toggleProgress';slidesToggle.id='toggleSlides';progressToggle.setAttribute('aria-controls','deckProgress');
const slideNav=$('layout').querySelector('nav');slideNav.id='slideNavigation';slidesToggle.setAttribute('aria-controls','slideNavigation');
viewButtons.append(progressToggle,slidesToggle);$('main').querySelector('.topbar').prepend(viewButtons);
function syncViewVisibility(){S.viewVisibility??={progress:true,slides:true};const v=S.viewVisibility;$('layout').classList.toggle('no-progress',!v.progress);$('layout').classList.toggle('no-slides',!v.slides);$('deckProgress').classList.toggle('hidden',!v.progress);progressToggle.textContent=v.progress?'Hide progress':'Show progress';slidesToggle.textContent=v.slides?'Hide slides':'Show slides';progressToggle.setAttribute('aria-expanded',String(v.progress));slidesToggle.setAttribute('aria-expanded',String(v.slides));}
progressToggle.onclick=()=>{S.viewVisibility.progress=!S.viewVisibility.progress;touch();syncViewVisibility()};slidesToggle.onclick=()=>{S.viewVisibility.slides=!S.viewVisibility.slides;touch();syncViewVisibility()};
const renderBeforeViewToggles=render;render=function(){renderBeforeViewToggles();syncViewVisibility();};
const snapshotBeforeViewToggles=snapshot;snapshot=function(){const doc=new DOMParser().parseFromString(snapshotBeforeViewToggles(),'text/html');doc.getElementById('viewVisibilityButtons')?.remove();return '<!doctype html>\n'+doc.documentElement.outerHTML;};
