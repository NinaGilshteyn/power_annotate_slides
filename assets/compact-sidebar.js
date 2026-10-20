S.toolboxOpen??={format:false,palette:false};
function setupToolDropdown(panel,label,key,id){
  const wrapper=el('div','tool-dropdown');wrapper.id=id;
  const button=el('button','tool-dropdown-toggle',label);button.type='button';button.setAttribute('role','switch');button.setAttribute('aria-label',label);button.setAttribute('aria-controls',panel.id);
  panel.before(wrapper);wrapper.append(button,panel);
  function sync(){const open=!!S.toolboxOpen?.[key];button.setAttribute('aria-checked',String(open));button.setAttribute('aria-expanded',String(open));panel.classList.toggle('hidden',!open);}
  button.onclick=()=>{S.toolboxOpen??={format:false,palette:false};S.toolboxOpen[key]=!S.toolboxOpen[key];sync();touch();};sync();return {wrapper,button,sync};
}
const formattingDropdown=setupToolDropdown($('textFormat'),'Format text','format','formatTextDropdown');
// The heading is now the accessible dropdown toggle itself.
$('paletteControls').querySelector('h3')?.remove();
const paletteDropdown=setupToolDropdown($('paletteControls'),'Color palette','palette','colorPaletteDropdown');
$('screenshotControls').before(paletteDropdown.wrapper);
const renderBeforeCompact=render;render=function(){renderBeforeCompact();formattingDropdown.sync();paletteDropdown.sync();};
const snapshotBeforeCompact=snapshot;snapshot=function(){const doc=new DOMParser().parseFromString(snapshotBeforeCompact(),'text/html');doc.getElementById('colorPaletteDropdown')?.remove();return '<!doctype html>\n'+doc.documentElement.outerHTML;};
