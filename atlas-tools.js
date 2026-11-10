"use strict";
(function(){
if(typeof db==="undefined"||typeof routine==="undefined")return;
const $t=id=>document.getElementById(id);
const el=(name,cls,txt)=>{const e=document.createElement(name);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;};
const box=$t("settings");
const tools=el("div","card");tools.append(el("h2",null,"Calculadoras de musculação"));
const description=el("p","at-v2-muted","Ferramentas auxiliares: confira sempre o peso real da barra e das anilhas disponíveis.");
const title=el("h3",null,"Calculadora de anilhas (barra olímpica)");
tools.append(description,title);
const layout=el("div","at-v2-cols");
const targetWrap=el("div");const targetLabel=el("label",null,"Carga total desejada (kg)");const target=el("input","field");target.type="number";target.value="60";target.min="20";target.step=".5";targetWrap.append(targetLabel,target);
const barWrap=el("div");const barLabel=el("label",null,"Peso da barra (kg)");const bar=el("select","field");[10,15,20].forEach(n=>{const opt=el("option",null,n+" kg");opt.value=n;bar.append(opt);});bar.value="20";barWrap.append(barLabel,bar);
layout.append(targetWrap,barWrap);tools.append(layout);
const plateResult=el("p","at-v2-tip");tools.append(plateResult);
const available=[25,20,15,10,5,2.5,1.25];const plateCalc=()=>{const total=Number(target.value),barKg=Number(bar.value);if(!Number.isFinite(total)||total<barKg||total>500){plateResult.textContent="Informe uma carga total válida, pelo menos igual ao peso da barra.";return;}let each=(total-barKg)/2,result=[];for(const plate of available){const qty=Math.floor((each+1e-6)/plate);if(qty>0){result.push(qty+" × "+plate+" kg");each=Math.round((each-qty*plate)*100)/100;}}plateResult.textContent=(result.join(" + ")||"Sem anilhas")+" em CADA lado"+(each>0.01?" · faltam "+each.toLocaleString("pt-BR")+" kg por lado com as anilhas consideradas.":".");};
target.addEventListener("input",plateCalc);bar.addEventListener("change",plateCalc);plateCalc();
const warmLabel=el("h3",null,"Sugestão de aquecimento");warmLabel.style.marginTop="19px";tools.append(warmLabel);
tools.append(el("p","at-v2-muted","Exemplo genérico, não substitui aquecimento específico nem altera suas séries efetivas."));
const warmInput=el("input","field");warmInput.type="number";warmInput.step=".5";warmInput.min="1";warmInput.max="500";warmInput.value="60";warmInput.setAttribute("aria-label","Carga de trabalho para cálculo de aquecimento");tools.append(warmInput);
const warmResult=el("div","at-v2-tip");tools.append(warmResult);
function warm(){const kg=Number(warmInput.value);if(!(kg>0&&kg<=500)){warmResult.textContent="Informe uma carga válida.";return;}warmResult.textContent="Aquecimento sugerido: "+[[.4,10],[.6,6],[.8,3]].map(([pct,reps])=>(Math.round(kg*pct*2)/2).toLocaleString("pt-BR")+" kg × "+reps+" reps").join(" · ")+"; ajuste à sua experiência e ao exercício.";}
warmInput.addEventListener("input",warm);warm();box.append(tools);
const history=$t("sessionHistory");
const card=el("div","card");card.append(el("h2",null,"Gerenciar treinos salvos"),el("p","at-v2-muted","Você pode corrigir séries salvas ou apagar uma sessão. Antes de alterações importantes, exporte um backup."));
const manager=el("div");card.append(manager);
history?.parentElement?.after(card);
function renderSaved(){
manager.replaceChildren();
if(!db.sessions.length){manager.append(el("p","at-v2-empty","Nenhum treino registrado."));return;}
db.sessions.slice().reverse().forEach((s,reverseIndex)=>{
const idx=db.sessions.length-1-reverseIndex;const title=el("div","at-v2-row");
const name=s.routineTitle||routine[s.day]?.title||"Treino";
const when=new Date(s.date).toLocaleDateString("pt-BR");
title.append(el("span",null,when+" · "+name));
const actions=el("div");const edit=el("button","at-mini","Editar");const del=el("button","at-mini","Excluir");actions.append(edit,del);title.append(actions);manager.append(title);
del.onclick=()=>{if(!confirm("Excluir DEFINITIVAMENTE este treino do histórico? Faça backup antes, se necessário."))return;db.sessions.splice(idx,1);persist();renderSaved();if(typeof renderHistory==="function")renderHistory();if(window.atlasRefreshAnalytics)window.atlasRefreshAnalytics();notice("Treino excluído do histórico.");};
edit.onclick=()=>{const staged=JSON.parse(JSON.stringify(s));
 const editor=el("div","at-v2-library");const note=el("textarea","at-v2-note");note.rows=2;note.value=s.notes||"";note.placeholder="Observações da sessão";editor.append(note);
 (staged.sets||[]).forEach((set,si)=>{const row=el("div","at-v2-row");const info=el("div","at-v2-muted",set.name+" • série "+set.set);const kg=el("input","at-v2-rpe");kg.type="number";kg.step=".5";kg.min="0";kg.max="500";kg.value=set.kg??"";kg.setAttribute("aria-label","Carga "+set.name);const reps=el("input","at-v2-rpe");reps.type="number";reps.min="0";reps.max="100";reps.value=set.reps??"";reps.setAttribute("aria-label","Repetições "+set.name);const assisted=el("button","at-mini",set.assisted?"🤝 Ajuda":"Sozinho");assisted.onclick=()=>{set.assisted=!set.assisted;assisted.textContent=set.assisted?"🤝 Ajuda":"Sozinho";};kg.onchange=()=>{if(kg.value!==""&&Number(kg.value)>=0&&Number(kg.value)<=500)set.kg=Number(kg.value);};reps.onchange=()=>{if(reps.value!==""&&Number(reps.value)>=0&&Number(reps.value)<=100)set.reps=Number(reps.value);};row.style.flexWrap="wrap";row.append(info,kg,reps,assisted);editor.append(row);});
 const save=el("button","at-v2-btn","Salvar correções"),cancel=el("button","at-v2-btn secondary","Fechar");
 save.onclick=()=>{staged.notes=note.value.slice(0,1500);db.sessions[idx]=staged;persist();editor.remove();if(typeof renderHistory==="function")renderHistory();if(window.atlasRefreshAnalytics)window.atlasRefreshAnalytics();notice("Correções salvas.");};
 cancel.onclick=()=>{editor.remove();};editor.append(save,cancel);if(title.nextSibling?.classList?.contains("at-v2-library"))title.nextSibling.remove();title.after(editor);
};
});
}
const navProgress=document.querySelectorAll('[data-page="progress"]');navProgress.forEach(b=>b.addEventListener("click",renderSaved));renderSaved();
})();
