"use strict";
/* Atlas Training v2 — treino avançado. Código próprio; não utiliza recursos internos do Hevy. */
(function(){
if(typeof db==="undefined"||typeof routine==="undefined"||typeof persist!=="function")return;
const $v=id=>document.getElementById(id), el=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x;};
const library=[
["Supino inclinado com halteres","Peito","Halteres"],["Supino reto com barra","Peito","Barra"],["Supino inclinado na máquina","Peito","Máquina"],["Supino reto com halteres","Peito","Halteres"],["Crucifixo na máquina","Peito","Máquina"],["Crucifixo inclinado","Peito","Halteres"],["Crossover na polia","Peito","Cabo"],["Flexão de braços","Peito","Peso corporal"],
["Puxada alta aberta","Costas","Máquina"],["Puxada alta neutra","Costas","Máquina"],["Barra fixa","Costas","Peso corporal"],["Remada articulada","Costas","Máquina"],["Remada baixa neutra","Costas","Cabo"],["Remada curvada com barra","Costas","Barra"],["Remada unilateral com halter","Costas","Halteres"],["Pulldown na polia","Costas","Cabo"],["Levantamento terra","Posteriores","Barra"],
["Desenvolvimento com halteres","Ombros","Halteres"],["Desenvolvimento com barra","Ombros","Barra"],["Elevação lateral","Ombros","Halteres"],["Elevação lateral na polia","Ombros","Cabo"],["Crucifixo inverso","Ombros","Máquina"],["Face pull","Ombros","Cabo"],["Elevação frontal","Ombros","Halteres"],
["Rosca direta","Bíceps","Barra"],["Rosca martelo","Bíceps","Halteres"],["Rosca Scott","Bíceps","Máquina"],["Rosca inclinada","Bíceps","Halteres"],["Rosca concentrada","Bíceps","Halteres"],["Rosca na polia","Bíceps","Cabo"],
["Tríceps na polia","Tríceps","Cabo"],["Tríceps francês","Tríceps","Halteres"],["Tríceps testa","Tríceps","Barra"],["Tríceps corda","Tríceps","Cabo"],["Tríceps banco","Tríceps","Peso corporal"],
["Agachamento no Smith","Quadríceps","Máquina"],["Agachamento livre","Quadríceps","Barra"],["Leg press 45°","Quadríceps","Máquina"],["Cadeira extensora","Quadríceps","Máquina"],["Cadeira adutora","Adutores","Máquina"],["Hack squat","Quadríceps","Máquina"],["Afundo","Quadríceps","Halteres"],
["Stiff","Posteriores","Barra"],["Mesa flexora","Posteriores","Máquina"],["Cadeira flexora","Posteriores","Máquina"],["Flexora em pé","Posteriores","Máquina"],["Agachamento búlgaro","Glúteos","Halteres"],["Elevação pélvica","Glúteos","Barra"],["Glúteo no cabo","Glúteos","Cabo"],["Cadeira abdutora","Glúteos","Máquina"],
["Panturrilha em pé","Panturrilhas","Máquina"],["Panturrilha sentado","Panturrilhas","Máquina"],["Panturrilha no leg press","Panturrilhas","Máquina"],
["Abdominal na polia","Abdômen","Cabo"],["Abdominal reverso","Abdômen","Peso corporal"],["Prancha","Abdômen","Peso corporal"]
];
const muscles=["Todos","Peito","Costas","Ombros","Bíceps","Tríceps","Quadríceps","Posteriores","Glúteos","Adutores","Panturrilhas","Abdômen","Outros"];
db.templates=Array.isArray(db.templates)?db.templates:[];
db.exMeta=db.exMeta&&typeof db.exMeta==="object"?db.exMeta:{};
db.customExercises=Array.isArray(db.customExercises)?db.customExercises:[];
db.exerciseNotes=db.exerciseNotes&&typeof db.exerciseNotes==="object"?db.exerciseNotes:{};
db.targets=db.targets&&typeof db.targets==="object"?db.targets:{};
db.restByExercise=db.restByExercise&&typeof db.restByExercise==="object"?db.restByExercise:{};
db.config={autoRest:true,defaultRest:120, ...db.config};
routine.splice(0,routine.length,...db.templates);
persist();
function saveTemplates(){db.templates=routine.map(r=>({day:r.day,title:r.title,ex:r.ex.map(x=>x.slice())}));persist();renderDays();}
function lastExercise(name){for(let i=db.sessions.length-1;i>=0;i--){const s=db.sessions[i];if(!s||!Array.isArray(s.sets))continue;const sets=s.sets.filter(x=>x&&x.name===name);if(sets.length)return {date:s.date,sets};}return {date:null,sets:[]};}
function historyRecords(name){const rows=[];db.sessions.forEach(s=>{if(!Array.isArray(s.sets))return;const sets=s.sets.filter(v=>v&&v.name===name);if(sets.length)rows.push({date:s.date,sets});});return rows;}
function muscleFor(name){const custom=db.customExercises.find(v=>v.name===name);if(custom)return custom.muscle||"Outros";const lib=library.find(v=>v[0]===name);return lib?lib[1]:"Outros";}
function workoutStats(draft){let done=0,vol=0;Object.values(draft||{}).forEach(v=>{if(v.done){done++;if(v.type!=="aquecimento"&&Number.isFinite(Number(v.kg))&&Number.isFinite(Number(v.reps))){vol+=Math.max(0,Number(v.kg))*Math.max(0,Number(v.reps));}}});return {done,vol};}
function setDraft(i,j,field,value){db.drafts[selected]??={};db.drafts[selected][i+"-"+j]??={};db.drafts[selected][i+"-"+j][field]=value;persist();updateLiveStats();}
function updateLiveStats(){const s=workoutStats(db.drafts[selected]);if($v("v2-live-count"))$v("v2-live-count").textContent=s.done+" séries";if($v("v2-live-volume"))$v("v2-live-volume").textContent=s.vol.toLocaleString("pt-BR",{maximumFractionDigits:1})+" kg acumulados"; }
function beginAutoRest(seconds){if(!seconds||!db.config.autoRest)return;const secondsValue=Math.min(600,Math.max(5,seconds));clearInterval(restTimer);restEnd=Date.now()+secondsValue*1000;function tick(){const remaining=Math.max(0,Math.ceil((restEnd-Date.now())/1000));$v("restClock").textContent=format(remaining).slice(3);if(!remaining){clearInterval(restTimer);if("vibrate" in navigator)navigator.vibrate([100,60,100]);notice("Descanso encerrado.");}}tick();restTimer=setInterval(tick,250);}
function oldBest(name){let best=0;historyRecords(name).forEach(r=>r.sets.forEach(s=>{if(s.assisted===true||s.type==="aquecimento")return;if(Number(s.kg)>best)best=Number(s.kg);}));return best;}
function progression(name,repsTarget){const records=historyRecords(name);if(!records.length)return "Primeiro registro: use uma carga controlada e anote todas as séries.";
const recent=records[records.length-1].sets.filter(s=>s.type!=="aquecimento"&&s.assisted!==true&&s.reps!=null&&s.kg!=null);
if(!recent.length)return "Ainda não há séries independentes suficientes para sugerir progressão.";
const match=String(repsTarget).match(/(\d+)\s*[–\-]\s*(\d+)/);const high=match?Number(match[2]):12;const atTop=recent.length>=2&&recent.every(s=>Number(s.reps)>=high);
const kg=Math.max(...recent.map(s=>Number(s.kg)||0));
if(atTop&&kg>0)return "Próxima meta sugerida: "+(Math.round((kg+(kg<30?1:2.5))*2)/2).toLocaleString("pt-BR")+" kg. Aumente apenas com boa técnica.";
return "Mantenha a carga e tente evoluir as repetições dentro da faixa antes de aumentar o peso.";
}
function moveExercise(i,direction){const list=routine[selected].ex,j=i+direction;if(j<0||j>=list.length)return;const draft=db.drafts[selected]||{};if(Object.values(draft).some(v=>v.done)){notice("Finalize o treino antes de reorganizar a ficha para não misturar séries.");return;}
const item=list[i];list[i]=list[j];list[j]=item;
for(const key of Object.keys(draft)){const parts=key.split("-");if(Number(parts[0])===i){draft["__swap__"+parts[1]]=draft[key];delete draft[key];}}
for(const key of Object.keys(draft)){const parts=key.split("-");if(Number(parts[0])===j){draft[i+"-"+parts[1]]=draft[key];delete draft[key];}}
for(const key of Object.keys(draft)){if(key.startsWith("__swap__")){draft[j+"-"+key.slice(8)]=draft[key];delete draft[key];}}
saveTemplates();renderExercises();}
const workoutCard=$v("exerciseList").parentElement;
const topControls=el("div","at-v2-toolbar");
const manageBtn=el("button",null,"+ Adicionar exercício");
const newRoutine=el("button",null,"+ Nova ficha");
const rename=el("button",null,"Renomear ficha");
topControls.append(manageBtn,newRoutine,rename);
workoutCard.insertBefore(topControls,$v("exerciseList"));
const libraryPanel=el("div","at-v2-library");libraryPanel.hidden=true;
const searchBox=el("input","field");searchBox.placeholder="Pesquisar exercício";searchBox.type="search";searchBox.setAttribute("aria-label","Pesquisar exercícios");
const muscleSelect=el("select","field");muscles.forEach(m=>{const op=el("option",null,m);op.value=m;muscleSelect.append(op);});muscleSelect.style.marginTop="8px";
const libraryList=el("div","at-v2-library-list");
const addCustom=el("button","at-v2-btn secondary","Criar exercício personalizado");
libraryPanel.append(searchBox,muscleSelect,libraryList,addCustom);workoutCard.insertBefore(libraryPanel,$v("exerciseList"));
const summary=el("div","at-v2-info");summary.append(el("span","at-v2-pill","Séries: "));summary.lastChild.id="v2-live-count";summary.append(el("span","at-v2-pill","Volume: "));summary.lastChild.id="v2-live-volume";workoutCard.insertBefore(summary,$v("exerciseList"));
const sessionNoteLabel=el("label",null,"Observações deste treino");
const sessionNote=el("textarea","at-v2-note");sessionNote.rows=2;sessionNote.placeholder="Ex.: dormi mal, novo recorde, treino mais leve";sessionNote.id="v2-sessionnote";
workoutCard.insertBefore(sessionNoteLabel,$v("finishWorkout"));workoutCard.insertBefore(sessionNote,$v("finishWorkout"));
sessionNote.oninput=()=>{db.workoutNotes??={};db.workoutNotes[selected]=sessionNote.value.slice(0,1500);persist();};
function renderLibrary(){libraryList.replaceChildren();const q=searchBox.value.trim().toLocaleLowerCase("pt-BR");const muscle=muscleSelect.value;
const choices=[...library.map(([name,m,e])=>({name,muscle:m,equipment:e})),...db.customExercises];
let shown=0;for(const item of choices){if(q&&!item.name.toLocaleLowerCase("pt-BR").includes(q))continue;if(muscle!=="Todos"&&item.muscle!==muscle)continue;if(shown++>=30)break;const row=el("div","at-v2-library-item");const text=el("span",null,item.name);const sub=el("div","at-v2-muted",item.muscle+" · "+item.equipment);const left=el("div");left.append(text,sub);const b=el("button","at-mini","+");b.setAttribute("aria-label","Adicionar "+item.name);b.onclick=()=>{routine[selected].ex.push([item.name,3,"8–12"]);saveTemplates();renderExercises();libraryPanel.hidden=true;notice(item.name+" adicionado à ficha.");};row.append(left,b);libraryList.append(row);}
if(!shown)libraryList.append(el("p","at-v2-empty","Nenhum exercício encontrado."));
}
manageBtn.onclick=()=>{libraryPanel.hidden=!libraryPanel.hidden;if(!libraryPanel.hidden){renderLibrary();searchBox.focus();}};
searchBox.oninput=renderLibrary;muscleSelect.onchange=renderLibrary;
addCustom.onclick=()=>{const name=(prompt("Nome do novo exercício:")||"").trim().slice(0,70);if(!name)return;if([...library.map(v=>v[0]),...db.customExercises.map(v=>v.name)].some(x=>x.toLocaleLowerCase("pt-BR")===name.toLocaleLowerCase("pt-BR"))){notice("Esse exercício já existe.");return;}const muscle=(prompt("Grupo muscular (ex.: Peito, Costas, Quadríceps):","Outros")||"Outros").trim().slice(0,40);const equipment=(prompt("Equipamento (ex.: Máquina, Barra, Halteres):","Máquina")||"Máquina").trim().slice(0,40);db.customExercises.push({name,muscle,equipment});persist();renderLibrary();notice("Exercício criado. Toque em + para adicioná-lo à ficha.");};
newRoutine.onclick=()=>{const title=(prompt("Nome da nova ficha:","Treino extra")||"").trim().slice(0,70);if(!title)return;routine.push({day:"Extra",title,ex:[]});selected=routine.length-1;saveTemplates();renderExercises();notice("Ficha criada. Agora adicione exercícios.");};
rename.onclick=()=>{const title=(prompt("Novo nome da ficha:",routine[selected].title)||"").trim().slice(0,70);if(!title)return;routine[selected].title=title;saveTemplates();notice("Nome atualizado.");};
renderExercises=function(){
  const container=$v("exerciseList");container.replaceChildren();const draft=db.drafts[selected]||{};
  sessionNote.value=(db.workoutNotes||{})[selected]||"";
  if(!routine[selected]){container.append(el("p","at-v2-empty","Crie ou importe seu primeiro treino."));return;}
  if(!routine[selected].ex.length)container.append(el("p","at-v2-empty","Ficha vazia. Use “Adicionar exercício” para começar."));
  routine[selected].ex.forEach(([name,n,reps],i)=>{
    const prior=lastExercise(name),block=el("div","exercise");
    const header=el("div","at-v2-head");const heading=el("h3",null,name);
    const musclesChip=el("span","at-v2-pill",muscleFor(name));
    const guide=el("button","at-v3-guide-button","❓ Como fazer");
    guide.type="button";guide.setAttribute("aria-label","Ver como executar "+name);
    guide.onclick=()=>{if(typeof window.atlasGuide==="function")window.atlasGuide(name,muscleFor(name));else notice("Guia indisponível, tente atualizar o aplicativo.");};
    header.append(heading,guide);block.append(header);
    const info=el("div","at-v2-tip",n+" séries · "+reps+" reps"+(prior.date?" · anterior: "+new Date(prior.date).toLocaleDateString("pt-BR"):""));block.append(info);
    const priorBest=oldBest(name);
    const bestLabel=el("div","at-v2-muted",priorBest>0?"Recorde independente: "+priorBest.toLocaleString("pt-BR")+" kg":"Sem recorde independente registrado");const options=el("details","atlas-exercise-options");options.append(el("summary",null,"Ajustes do exercício"),bestLabel);
    const goalRow=el("div","at-v2-extras");
    const goal=el("input","field");goal.type="number";goal.step=".5";goal.min="0";goal.max="500";goal.style.width="110px";goal.placeholder="Meta (kg)";goal.value=db.targets[name]??"";goal.setAttribute("aria-label","Meta de carga: "+name);
    goal.onchange=()=>{if(goal.value==="")delete db.targets[name];else if(Number(goal.value)>=0&&Number(goal.value)<=500)db.targets[name]=Number(goal.value);persist();};
    const restLabel=el("span","at-v2-muted","⏱️ Descanso");
    const restSelect=el("select");const restVals=[0,60,90,120,150,180,240,300];restVals.forEach(v=>{const o=el("option",null,v?v+"s":"Off");o.value=v;restSelect.append(o);});restSelect.value=String(db.restByExercise[name]??db.config.defaultRest);restSelect.onchange=()=>{db.restByExercise[name]=Number(restSelect.value);persist();};
    goalRow.append(goal,restLabel,restSelect);options.append(goalRow);
    const note=el("textarea","at-v2-note");note.rows=1;note.maxLength=400;note.value=db.exerciseNotes[name]||"";note.placeholder="Nota pessoal do exercício (opcional)";note.onchange=()=>{db.exerciseNotes[name]=note.value.slice(0,400);persist();};options.append(note);
    const headingRow=el("div","at-v2-setrow muted");["SÉRIE","ANTERIOR","KG","REPS","✓"].forEach(t=>headingRow.append(el("span",null,t)));block.append(headingRow);
    for(let j=0;j<n;j++){
      const key=i+"-"+j,v=draft[key]||{},previousSet=prior.sets.find(x=>Number(x.set)===j+1);
      const folder=el("details","at-v3-series-folder");
      folder.open=!v.done;
      const summary=el("summary","at-v3-series-summary");
      function updateFolderSummary(){const current=(db.drafts[selected]||{})[key]||{};
        summary.textContent=current.done ? "✓ Série "+(j+1)+" · "+(current.kg??"—")+" kg × "+(current.reps??"—")+" reps"+(current.assisted?" · 🤝":"") : "Série "+(j+1);
      }
      updateFolderSummary();folder.append(summary);
      folder.addEventListener("change", updateFolderSummary);
      folder.addEventListener("input", updateFolderSummary);
      folder.addEventListener("click", () => queueMicrotask(updateFolderSummary));
      const row=el("div","at-v2-setrow"),setNum=el("span","at-v2-muted",j+1);row.append(setNum);
      const kg=el("input");kg.type="number";kg.min="0";kg.max="500";kg.step=".5";kg.value=v.kg??"";kg.placeholder="kg";kg.setAttribute("aria-label",name+" série "+(j+1)+" carga");kg.oninput=()=>setDraft(i,j,"kg",kg.value===""?"":Number(kg.value));row.append(kg);
      const repsBox=el("div","at-v2-reps");const repsIn=el("input");repsIn.type="number";repsIn.min="0";repsIn.max="100";repsIn.step="1";repsIn.placeholder="reps";repsIn.value=v.reps??"";repsIn.setAttribute("aria-label",name+" série "+(j+1)+" repetições");repsIn.oninput=()=>setDraft(i,j,"reps",repsIn.value===""?"":Number(repsIn.value));
      const help=el("button","at-v2-assist",v.assisted?"🤝 Com ajuda":"🤝 Sem ajuda");help.type="button";help.setAttribute("aria-pressed",String(v.assisted===true));help.setAttribute("aria-label",name+" série "+(j+1)+" marcar auxílio");help.title=v.assisted?"Com ajuda":"Sem ajuda";help.onclick=()=>{const next=help.getAttribute("aria-pressed")!=="true";help.setAttribute("aria-pressed",String(next));help.title=next?"Com ajuda":"Sem ajuda";help.textContent=next?"🤝 Com ajuda":"🤝 Sem ajuda";setDraft(i,j,"assisted",next);};repsBox.append(repsIn);row.append(repsBox);
      const check=el("input");check.type="checkbox";check.checked=!!v.done;check.setAttribute("aria-label",name+" série "+(j+1)+" concluída");
      check.onchange=()=>{if(check.checked&&(kg.value===""||repsIn.value===""||!Number.isFinite(Number(kg.value))||Number(kg.value)<0||Number(kg.value)>500||!Number.isInteger(Number(repsIn.value))||Number(repsIn.value)<1||Number(repsIn.value)>100)){check.checked=false;notice("Preencha a carga (0 a 500 kg) e as repetições (1 a 100) antes de concluir a série.");return;}setDraft(i,j,"done",check.checked);updateFolderSummary();folder.open=!check.checked;if(check.checked){if(!db.timer.startedAt&&!db.timer.elapsed){db.timer.startedAt=Date.now();persist();showClock();}const nextType=(draft[i+"-"+(j+1)]||{}).type;if(nextType!=="dropset"&&v.type!=="dropset")beginAutoRest(db.restByExercise[name]??db.config.defaultRest);const p=priorBest;if(Number(kg.value)>p&&v.assisted!==true&&v.type!=="aquecimento"&&Number(kg.value)>0)notice("Possível novo recorde de carga independente! 🏆");}};
      row.append(check);folder.append(row,help);
      const previousLine=el("div","at-v2-prior");
      if(previousSet){const previousButton=el("button",null,(previousSet.kg??"—")+" × "+(previousSet.reps??"—")+(previousSet.assisted===true?" · 🤝":previousSet.assisted===false?" · sozinho":""));previousButton.type="button";previousButton.onclick=()=>{if(previousSet.kg!==null&&previousSet.kg!==undefined)setDraft(i,j,"kg",previousSet.kg);if(previousSet.reps!==null&&previousSet.reps!==undefined)setDraft(i,j,"reps",previousSet.reps);renderExercises();notice("Valores anteriores copiados.");};previousLine.append(previousButton);}else previousLine.textContent="—";row.insertBefore(previousLine,row.children[1]);
      const types=el("div","at-v2-extras"),sel=el("select","at-v2-type");[["normal","Normal"],["aquecimento","Aquecimento"],["falha","Até a falha"],["dropset","Drop set"]].forEach(([value,txt])=>{const op=el("option",null,txt);op.value=value;sel.append(op);});sel.value=v.type||"normal";sel.setAttribute("aria-label","Tipo de série "+(j+1));sel.onchange=()=>setDraft(i,j,"type",sel.value);
      const rpe=el("input","at-v2-rpe");rpe.type="number";rpe.min="1";rpe.max="10";rpe.step=".5";rpe.placeholder="RPE";rpe.value=v.rpe??"";rpe.setAttribute("aria-label",name+" série "+(j+1)+" esforço percebido RPE");rpe.oninput=()=>setDraft(i,j,"rpe",rpe.value===""?null:Number(rpe.value));
      types.append(sel,el("span","at-v2-muted","RPE"),rpe);const seriesOptions=el("details","atlas-series-options");seriesOptions.open=!!v.rpe||!!(v.type&&v.type!=="normal");seriesOptions.append(el("summary",null,"Tipo e esforço"),types);folder.append(seriesOptions);block.append(folder);
    }
    const bottom=el("div","at-v2-toolbar");
    const add=el("button",null,"+ Série");add.onclick=()=>{if(n>=15){notice("Limite de 15 séries por exercício.");return;}routine[selected].ex[i][1]=n+1;saveTemplates();renderExercises();};
    const sub=el("button",null,"− Série");sub.onclick=()=>{if(n<=1){notice("Mantenha pelo menos uma série.");return;}const value=(db.drafts[selected]||{})[i+"-"+(n-1)];if(value&&Object.values(value).some(Boolean)&&!confirm("Remover a última série e os dados dela?"))return;delete (db.drafts[selected]||{})[i+"-"+(n-1)];routine[selected].ex[i][1]=n-1;saveTemplates();renderExercises();};
    const up=el("button",null,"↑");up.title="Mover exercício para cima";up.onclick=()=>moveExercise(i,-1);
    const down=el("button",null,"↓");down.title="Mover exercício para baixo";down.onclick=()=>moveExercise(i,1);
    const remove=el("button",null,"Remover");remove.onclick=()=>{if(!confirm("Remover "+name+" desta ficha? O histórico salvo continuará intacto."))return;const draft=db.drafts[selected]||{};if(Object.values(draft).some(v=>v.done)){notice("Finalize o treino antes de remover um exercício da ficha.");return;}routine[selected].ex.splice(i,1);db.drafts[selected]=Object.fromEntries(Object.entries(draft).filter(([key])=>Number(key.split("-")[0])!==i).map(([key,value])=>{const [ei,si]=key.split("-").map(Number);return [(ei>i?ei-1:ei)+"-"+si,value];}));saveTemplates();renderExercises();};
    bottom.append(add,sub,up,down,remove);options.append(bottom);block.append(options);
    const details=el("details","at-v2-details");const sum=el("summary",null,"Progressão sugerida");details.append(sum,el("p","at-v2-tip",progression(name,reps)));block.append(details);
    container.append(block);
  });
  updateLiveStats();
};
$("finishWorkout").onclick=()=>{
  const total=db.drafts[selected]||{},sets=Object.entries(total).filter(([,v])=>v.done).map(([key,v])=>{
    const [i,j]=key.split("-").map(Number),exercise=routine[selected].ex[i];
    return exercise?{name:exercise[0],set:j+1,kg:v.kg??null,reps:v.reps??null,assisted:v.assisted===true,type:v.type||"normal",rpe:v.rpe??null}:null;
  }).filter(Boolean);
  if(!sets.length){notice("Marque pelo menos uma série concluída.");return;}
  if(sets.some(s=>s.kg===null||s.reps===null||s.kg===""||s.reps==="")){notice("Preencha carga e repetições das séries concluídas antes de salvar.");return;}
  if(sets.some(s=>!Number.isFinite(Number(s.kg))||Number(s.kg)<0||Number(s.kg)>500||!Number.isInteger(Number(s.reps))||Number(s.reps)<1||Number(s.reps)>100)){notice("Confira carga e repetições das séries concluídas.");return;}
  const previous=new Map();sets.forEach(s=>{if(!previous.has(s.name))previous.set(s.name,oldBest(s.name));});
  const seconds=duration(),notes=sessionNote.value.trim().slice(0,1500);
  db.sessions.push({date:new Date().toISOString(),day:selected,routineTitle:routine[selected].title,seconds,sets,notes});
  db.attendance[dateKey(new Date())]="feito";delete db.drafts[selected];if(db.workoutNotes)delete db.workoutNotes[selected];db.timer={elapsed:0,startedAt:null};
  persist();renderExercises();renderCalendar();showClock();
  const records=sets.filter(s=>s.assisted!==true&&s.type!=="aquecimento"&&Number(s.kg)>Number(previous.get(s.name)||0)).map(s=>s.name);
  notice("Treino salvo: "+sets.length+" séries · "+format(seconds)+(records.length?" · 🏆 Novo recorde: "+[...new Set(records)].join(", "):""));
  if(typeof window.atlasRefreshAnalytics==="function")window.atlasRefreshAnalytics();
};
renderDays();renderExercises();window.atlasV2={library,historyRecords,muscleFor,progression,saveTemplates};
})();
