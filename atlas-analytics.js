"use strict";
(function(){
if(typeof db==="undefined"||typeof routine==="undefined")return;
const $a=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(txt!==undefined)v.textContent=String(txt);return v;};
const chartNS="http://www.w3.org/2000/svg";
function fmt(n){return Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:1});}
function date(s){const d=new Date(s);return isNaN(d.getTime())?"Data desconhecida":d.toLocaleDateString("pt-BR");}
function setsOf(s){return Array.isArray(s?.sets)?s.sets:[];}
const historyPage=$a("progress");
const historyCard=$a("sessionHistory")?.parentElement;
if(!historyCard)return;
const panel=el("div","card");panel.id="at-v2-analytics";panel.append(el("h2",null,"Estatísticas e recordes"));
const stat=el("div","at-v2-stat");
const views=[["0","Volume registrado"],["0","Séries registradas"],["0","Tempo de treino"]];
views.forEach(([n,t],i)=>{const box=el("div");const number=el("div","at-v2-num",n);number.id="at-v2-kpi-"+i;box.append(number,el("div","at-v2-label",t));stat.append(box);});
panel.append(stat);
const legend=el("p","at-v2-muted","Volume de treino = soma de carga × repetições (sem séries de aquecimento). É um indicador aproximado, não mede esforço real ou equivalência entre exercícios.");
panel.append(legend);
const pickerLabel=el("label",null,"Analisar exercício");pickerLabel.setAttribute("for","at-v2-pick");
const picker=el("select","field");picker.id="at-v2-pick";
const graph=el("svg","at-v2-chart");graph.setAttribute("viewBox","0 0 320 150");graph.setAttribute("role","img");graph.setAttribute("aria-label","Gráfico de evolução de carga máxima por sessão");
const graphDesc=el("p","at-v2-muted");
const exerciseStats=el("div");
panel.append(pickerLabel,picker,graph,graphDesc,exerciseStats);
const muscles=el("div");muscles.style.marginTop="15px";
panel.append(el("h3",null,"Volume por grupo muscular (últimas 4 semanas)"),muscles);
historyPage.insertBefore(panel,historyCard);
const utilities=el("div","card");utilities.append(el("h2",null,"Exportar histórico"));
const csv=el("button","at-v2-btn","Baixar treinos em CSV");csv.onclick=()=>{
  const lines=[["Data","Ficha","Exercício","Série","Carga kg","Repetições","Ajuda","Tipo","RPE","Duração segundos"]];
  db.sessions.forEach(s=>setsOf(s).forEach(v=>lines.push([date(s.date),s.routineTitle||routine[s.day]?.title||"Treino",v.name||"",v.set??"",v.kg??"",v.reps??"",v.assisted===true?"Sim":v.assisted===false?"Não":"Não registrado",v.type||"Normal",v.rpe??"",s.seconds??""])));
  const csvText="\uFEFF"+lines.map(row=>row.map(val=>'"'+String(val).replace(/"/g,'""')+'"').join(";")).join("\r\n");
  const blob=new Blob([csvText],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="atlas-treinos.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
};
utilities.append(csv,el("p","at-v2-muted","O CSV inclui dados de treino pessoais. Guarde o arquivo em local privado."));
historyPage.append(utilities);
const settingsPage=$a("settings");
if(settingsPage){const settings=el("div","card");settings.append(el("h2",null,"Ajustes do treino"));const row=el("div","at-v2-row");row.append(el("span",null,"Descanso automático após marcar série"));
const cb=el("input");cb.type="checkbox";cb.checked=db.config?.autoRest!==false;cb.setAttribute("aria-label","Ativar descanso automático");cb.onchange=()=>{db.config??={};db.config.autoRest=cb.checked;persist();};row.append(cb);settings.append(row);const row2=el("div","at-v2-row");row2.append(el("span",null,"Descanso padrão"));const sel=el("select","field");sel.style.maxWidth="120px";[60,90,120,150,180,240,300].forEach(s=>{const op=el("option",null,s+" segundos");op.value=s;sel.append(op);});sel.value=String(db.config?.defaultRest||120);sel.onchange=()=>{db.config.defaultRest=Number(sel.value);persist();};row2.append(sel);settings.append(row2);settingsPage.append(settings);}
function records(name){const out=[];db.sessions.forEach(s=>{const series=setsOf(s).filter(v=>v.name===name&&v.type!=="aquecimento"&&v.assisted!==true&&Number.isFinite(Number(v.kg))&&v.kg!==null&&v.kg!==""&&Number.isFinite(Number(v.reps))&&v.reps!==null&&v.reps!==""&&Number(v.reps)>0);if(series.length)out.push({date:s.date,sets:series,max:Math.max(...series.map(v=>Number(v.kg))),volume:series.reduce((a,v)=>a+Number(v.kg)*Number(v.reps),0)});});return out;}
function renderLine(values){
  graph.replaceChildren();
  if(!values.length){graphDesc.textContent="Treine este exercício para começar a visualizar a progressão.";return;}
  const data=values.slice(-12),max=Math.max(1,...data.map(x=>x.max)),min=Math.max(0,Math.min(...data.map(x=>x.max))-5),range=Math.max(1,max-min),points=data.map((x,i)=>({x:20+(data.length===1?0:i*280/(data.length-1)),y:122-(x.max-min)/range*94,kg:x.max}));
  const horizontal=document.createElementNS(chartNS,"line");horizontal.setAttribute("x1","20");horizontal.setAttribute("x2","300");horizontal.setAttribute("y1","122");horizontal.setAttribute("y2","122");horizontal.setAttribute("stroke","#74858d");graph.append(horizontal);
  if(points.length>1){const line=document.createElementNS(chartNS,"polyline");line.setAttribute("points",points.map(p=>p.x+","+p.y).join(" "));line.setAttribute("fill","none");line.setAttribute("stroke","#dfff00");line.setAttribute("stroke-width","3");graph.append(line);}
  points.forEach(p=>{const dot=document.createElementNS(chartNS,"circle");dot.setAttribute("cx",p.x);dot.setAttribute("cy",p.y);dot.setAttribute("r","4");dot.setAttribute("fill","#dfff00");graph.append(dot);});
  graphDesc.textContent="Últimas "+data.length+" sessões · carga máxima independente de cada sessão: "+fmt(data.at(-1).max)+" kg.";
}
function renderAnalytics(){
  const all=db.sessions.flatMap(s=>setsOf(s));
  const normal=all.filter(v=>v.type!=="aquecimento");
  const volume=normal.reduce((a,v)=>a+(Number.isFinite(Number(v.kg))&&Number.isFinite(Number(v.reps))?Math.max(0,Number(v.kg))*Math.max(0,Number(v.reps)):0),0);
  $a("at-v2-kpi-0").textContent=fmt(volume)+" kg";
  $a("at-v2-kpi-1").textContent=String(all.length);
  $a("at-v2-kpi-2").textContent=fmt(db.sessions.reduce((a,s)=>a+Number(s.seconds||0),0)/3600)+" h";
  const names=[...new Set([...routine.flatMap(r=>r.ex.map(x=>x[0])),...all.map(v=>v.name).filter(Boolean)])];
  const old=picker.value;picker.replaceChildren();names.forEach(name=>{const op=el("option",null,name);op.value=name;picker.append(op);});if(names.includes(old))picker.value=old;
  const selectedName=picker.value,rows=records(selectedName);renderLine(rows);
  exerciseStats.replaceChildren();
  if(rows.length){const best=Math.max(...rows.flatMap(r=>r.sets.map(v=>Number(v.kg)))),total=rows.reduce((a,r)=>a+r.volume,0),maxReps=Math.max(...rows.flatMap(r=>r.sets.map(v=>Number(v.reps))));
    [ ["Recorde de carga independente",fmt(best)+" kg"],["Maior número de repetições",maxReps+" reps"],["Volume histórico",fmt(total)+" kg"] ].forEach(([k,v])=>{const row=el("div","at-v2-row");row.append(el("span",null,k),el("strong",null,v));exerciseStats.append(row);});}
  muscles.replaceChildren();const cutoff=Date.now()-28*24*3600*1000,map=new Map();
  db.sessions.forEach(s=>{const stamp=new Date(s.date).getTime();if(!Number.isFinite(stamp)||stamp<cutoff)return;setsOf(s).forEach(v=>{if(v.type==="aquecimento")return;const muscle=window.atlasV2?.muscleFor?.(v.name)||"Outros";map.set(muscle,(map.get(muscle)||0)+1);});});
  const arr=[...map.entries()].sort((a,b)=>b[1]-a[1]),highest=Math.max(1,...arr.map(x=>x[1]));if(!arr.length){muscles.append(el("p","at-v2-empty","Seus grupos musculares aparecerão aqui após registrar treinos."));return;}
  arr.forEach(([name,count])=>{const row=el("div","at-v2-row");row.append(el("span",null,name),el("span",null,count+" séries"));muscles.append(row);const bar=el("div","at-v2-bar"),fill=el("span");fill.style.width=(count/highest*100)+"%";bar.append(fill);muscles.append(bar);});
}
picker.onchange=renderAnalytics;
window.atlasRefreshAnalytics=renderAnalytics;
document.querySelectorAll('[data-page="progress"]').forEach(b=>b.addEventListener("click",renderAnalytics));
renderAnalytics();
})();
