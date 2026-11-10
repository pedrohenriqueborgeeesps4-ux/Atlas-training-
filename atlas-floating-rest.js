"use strict";
(function(){
if(typeof restEnd==="undefined"||typeof restTimer==="undefined")return;
const timerPanel=document.getElementById("restClock");if(!timerPanel)return;
const bar=document.createElement("div");bar.id="atlas-floating-rest";bar.setAttribute("aria-label","Controle rápido de descanso");bar.hidden=true;
const title=document.createElement("div");title.className="atlas-floating-info";
const small=document.createElement("small");small.textContent="DESCANSO · TREINO";
const time=document.createElement("strong");time.textContent="02:00";
const training=document.createElement("span");training.textContent="00:00:00";
title.append(small,time,training);bar.append(title);
const buttons=document.createElement("div");buttons.className="atlas-floating-actions";
const choices=[[60,"1m"],[90,"1m30"],[120,"2m"],[180,"3m"],[0,"Parar"]];
function start(seconds){
clearInterval(restTimer);
restEnd=seconds?Date.now()+seconds*1000:0;
function tick(){
 const remaining=restEnd?Math.max(0,Math.ceil((restEnd-Date.now())/1000)):0;
 const formatted=String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");
 timerPanel.textContent=formatted;time.textContent=formatted;
 if(!remaining){clearInterval(restTimer);if(seconds>0&&"vibrate" in navigator)navigator.vibrate([100,60,100]);}
}
tick();if(seconds)restTimer=setInterval(tick,250);
}
choices.forEach(([seconds,label])=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.setAttribute("aria-label",seconds?"Descansar "+seconds+" segundos":"Parar descanso");b.onclick=()=>start(seconds);buttons.append(b);});
bar.append(buttons);document.body.append(bar);
function sync(){
const workout=document.getElementById("workout");bar.hidden=!!workout?.hidden;
const clock=document.getElementById("sessionClock");if(clock)training.textContent=clock.textContent;
if(timerPanel)time.textContent=timerPanel.textContent;
}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>setTimeout(sync,0)));
window.addEventListener("visibilitychange",sync);
setInterval(sync,500);sync();
})();