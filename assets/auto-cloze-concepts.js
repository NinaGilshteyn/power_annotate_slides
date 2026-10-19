function proposeAutoCloze(text){
  if(!text.trim())return {text,count:0,reason:'Paste or type a statement into Text first.'};
  const rx=/\{\{c([1-9]\d*)::([^{}]+?)\}\}/g,existing=[...text.matchAll(rx)];
  if(/[{}]/.test(text.replace(rx,'')))return {text,count:0,reason:'Fix unfinished cloze braces before using Auto cloze.'};
  let next=existing.length?Math.max(...existing.map(m=>Number(m[1])))+1:1;
  const masked=text.replace(rx,m=>' '.repeat(m.length));
  const stop=new Set(('a an the and or but so for of to in on at as by is are was were be been being am has have had do does did can could may might must shall should will would it its this that these those they their them we our you your he she his her what which who whom whose when where why how all any each every either neither both some such other another many much most more less few several very also only just not no yes than then there here into onto from with without within through between among across during before after above below under over out up down per via about against around because if unless until while although since yet even too enough same different following example including include includes included called call means mean indicates indicated shown shows show results result causes cause caused causing gives give given makes make made allows allow allowed enabling enables enable produces produce produced producing requires require required requiring contains contain contained containing consists consisting composed comprised plays play site junction contact contacts contacting connect connects connected connecting mediate mediates mediated mediating bind binds binding bound interacts interact interacting interaction needed need needs forms form formed forming occurs occur occurring found used uses use using measured measure compared compares compare based able successfully easily important key common general certain corresponding respective typically often usually sometimes always never inside outside neighboring nearby extracellular intracellular').split(' '));
  const generic=new Set(['cells','cell','molecules','molecule','proteins','protein','systems','system','process','processes','things','thing','part','parts','way','ways']);
  const picks=[],limit=12;
  for(const sentence of masked.matchAll(/[^.!?\n]+(?:[.!?]|$)/g)){
    const offset=sentence.index,body=sentence[0];
    const words=[...body.matchAll(/\b[A-Za-z][A-Za-z0-9]*(?:[-–][A-Za-z0-9]+)*\b|\b\d+(?:\.\d+)?(?:%|[a-zA-Z]+)?\b/g)];
    if(words.length<3)continue;
    const groups=[];let group=[];
    function flush(){if(group.length){groups.push(group);group=[];}}
    for(const w of words){if(stop.has(w[0].toLowerCase())){flush();continue}if(group.length&&(body.slice(group.at(-1).index+group.at(-1)[0].length,w.index).trim()||group.length>=3))flush();group.push(w)}flush();
    const candidates=groups.map(g=>{while(g.length>1&&generic.has(g[0][0].toLowerCase()))g.shift();const start=offset+g[0].index,end=offset+g.at(-1).index+g.at(-1)[0].length,value=text.slice(start,end);let score=Math.min(value.length,24)/4+(g.length>1?2:0);if(g.every(w=>generic.has(w[0].toLowerCase())))score-=6;if(/\b[A-Z]{2,}\b/.test(value))score+=3;if(/(?:tion|sion|ase|ity|ism|in|ment|sis|ics|ogen|philic|some|brane|filament)s?$/i.test(value))score+=2;return {start,end,score,words:g.length,value};}).filter(c=>c.score>0&&c.value.length>=3).sort((a,b)=>b.score-a.score||a.start-b.start);
    let accepted=0,hidden=0;
    const sentenceStart=offset,sentenceEnd=offset+body.length;
    const originalSentence=text.slice(sentenceStart,sentenceEnd);
    const existingHere=existing.filter(m=>m.index>=sentenceStart&&m.index<sentenceEnd);
    const oldHidden=existingHere.reduce((n,m)=>n+m[2].split('::')[0].trim().split(/\s+/).length,0);
    const total=words.length+oldHidden,cap=Math.max(1,Math.floor(total*.55));
    for(const c of candidates){if(accepted+existingHere.length>=3||picks.length>=limit)break;if(hidden+oldHidden+c.words>cap)continue;picks.push(c);hidden+=c.words;accepted++;}
    if(picks.length>=limit)break;
  }
  picks.sort((a,b)=>a.start-b.start).forEach(p=>p.n=next++);
  let result=text;for(const p of picks.slice().reverse())result=result.slice(0,p.start)+'{{c'+p.n+'::'+result.slice(p.start,p.end)+'}}'+result.slice(p.end);
  return {text:result,count:picks.length,reason:picks.length?'Suggested related concepts and phrases. Review context and wording before saving.':'No additional suitable concepts found. Existing clozes are preserved.'};
}
