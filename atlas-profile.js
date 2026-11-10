"use strict";
(function(){
if(typeof db==="undefined")return;
const settings=document.getElementById("settings");if(!settings)return;
const card=document.createElement("div");card.className="card";const h=document.createElement("h2");h.textContent="Seu perfil e suas metas";card.append(h);
const description=document.createElement("p");description.className="muted";description.textContent="As metas e os registros são individuais neste aparelho. Para utilizar em múltiplos dispositivos ou compartilhar o mesmo aparelho com outros usuários, será necessário criar contas isoladas e autenticação segura.";card.append(description);
const row=document.createElement("div");row.className="grid";
const label=document.createElement("label");label.textContent="Meta de peso (kg)";label.setAttribute("for","atlas-goal");
const input=document.createElement("input");input.id="atlas-goal";input.className="field";input.type="number";input.min="30";input.max="300";input.step=".1";input.value=db.profile?.goal??"";
const col=document.createElement("div");col.append(label,input);
const second=document.createElement("div");const label2=document.createElement("label");label2.textContent="Meta de treinos por semana";label2.setAttribute("for","atlas-frequency");
const freq=document.createElement("input");freq.id="atlas-frequency";freq.type="number";freq.min="1";freq.max="7";freq.step="1";freq.className="field";freq.value=db.profile?.frequency||5;
second.append(label2,freq);row.append(col,second);card.append(row);
const save=document.createElement("button");save.className="btn";save.textContent="Salvar metas";save.style.marginTop="12px";save.onclick=()=>{
 const goal=input.value===""?null:Number(input.value),n=Number(freq.value);
 if(goal!==null&&(!Number.isFinite(goal)||goal<30||goal>300)){notice("Informe uma meta de peso entre 30 e 300 kg.");return}
 if(!Number.isInteger(n)||n<1||n>7){notice("Informe frequência entre 1 e 7 dias.");return}
 db.profile={...(db.profile||{}),goal,frequency:n};persist();notice("Metas pessoais atualizadas.");
};card.append(save);
settings.insertBefore(card,settings.firstChild);
})();
