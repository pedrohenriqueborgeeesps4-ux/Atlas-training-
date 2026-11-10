"use strict";
(function(){
const specifics={
"Supino inclinado com halteres":["Ajuste o banco para inclinação moderada (15–30°).","Mantenha os pés firmes e escápulas estáveis.","Desça os halteres ao lado da parte superior do peito e empurre com controle.","Evite elevar os ombros e arquear excessivamente a lombar."],
"Supino reto com barra":["Mantenha pés no chão e escápulas apoiadas.","Desça a barra com controle à região média do peito.","Empurre de volta sem perder a estabilidade.","Use suportes de segurança ou alguém para auxiliar com cargas elevadas."],
"Elevação lateral":["Mantenha cotovelos ligeiramente flexionados.","Eleve os braços lateralmente até perto da altura dos ombros.","Desça devagar, sem balançar o corpo.","Evite encolher os ombros ou jogar o tronco."],
"Puxada alta aberta":["Segure a barra além da largura dos ombros.","Leve os cotovelos para baixo e a barra à frente do peito.","Controle a subida sem perder a postura.","Evite puxar a barra atrás da cabeça."],
"Remada baixa neutra":["Sente-se firme com a coluna neutra.","Puxe o pegador em direção ao abdômen.","Retorne controladamente com os braços estendendo.","Evite impulsionar o peso com a lombar."],
"Agachamento no Smith":["Posicione a barra e os pés de modo estável.","Flexione quadris e joelhos com amplitude confortável.","Suba empurrando o chão.","Evite levantar os calcanhares ou perder o alinhamento dos joelhos."],
"Leg press 45°":["Ajuste banco e pés firmes na plataforma.","Flexione os joelhos até antes de perder contato da lombar com o banco.","Empurre sem travar violentamente os joelhos.","Use as travas e evite amplitude que arredonde a lombar."],
"Stiff":["Mantenha joelhos levemente flexionados.","Leve o quadril para trás, com carga perto das pernas e coluna neutra.","Retorne estendendo os quadris.","Evite arredondar a lombar para buscar amplitude."],
"Agachamento búlgaro":["Apoie o pé traseiro em banco baixo e mantenha o da frente estável.","Flexione quadril e joelho da frente de forma controlada.","Suba impulsionando o pé dianteiro contra o chão.","Segure em um apoio para melhorar o equilíbrio se necessário."],
"Elevação pélvica":["Apoie a parte alta das costas em banco firme.","Empurre os calcanhares e eleve os quadris.","Desça lentamente mantendo o tronco estável.","Não hiperestenda a lombar no topo."],
"Prancha":["Apoie antebraços e pés no chão.","Mantenha tronco e quadril alinhados.","Contraia abdômen e respire regularmente.","Evite afundar a lombar ou prender o ar."]
};
const guides={
Peito:["Ajuste o banco ou a máquina para manter ombros estáveis.","Faça a fase de retorno controladamente, sem deixar a carga cair.","Use amplitude confortável e mantenha punhos alinhados.","Evite desconforto no ombro e impulsos excessivos."],
Costas:["Ajuste o equipamento e estabilize o tronco.","Puxe movendo cotovelos na direção planejada, sem balanço.","Volte lentamente, permitindo movimento controlado das escápulas.","Evite compensar com a lombar."],
Ombros:["Mantenha tronco e escápulas estáveis.","Mova os braços na amplitude confortável, sem impulso.","Retorne lentamente, controlando a carga.","Evite encolher os ombros ou usar peso que prejudique a postura."],
Bíceps:["Mantenha os cotovelos relativamente estáveis.","Flexione os cotovelos contra a resistência.","Desça lentamente sem balançar o tronco.","Evite hiperextensão forçada."],
Tríceps:["Estabilize o tronco e mantenha os cotovelos alinhados.","Estenda os cotovelos sem empurrar com o corpo.","Retorne controladamente.","Evite movimentos bruscos ou amplitudes dolorosas."],
Quadríceps:["Ajuste o equipamento e a posição dos pés.","Flexione e estenda os joelhos com controle e boa estabilidade.","Use amplitude adequada à mobilidade e ao aparelho.","Evite tirar os calcanhares do apoio ou perder o alinhamento dos joelhos."],
Posteriores:["Mantenha o tronco estável e ajuste os apoios do equipamento.","Flexione os joelhos ou faça a dobradiça de quadril conforme o exercício.","Retorne lentamente, sem soltar o peso.","Evite arquear ou arredondar demais a lombar."],
Glúteos:["Mantenha pés e quadris estáveis.","Conduza o movimento pelo quadril com amplitude confortável.","Retorne lentamente sem usar impulso.","Evite compensar com a lombar."],
Adutores:["Ajuste os apoios nas coxas.","Aproxime as pernas de maneira controlada.","Volte lentamente.","Evite movimentos bruscos."],
Panturrilhas:["Posicione a parte anterior dos pés firmemente no suporte.","Eleve os calcanhares usando os tornozelos.","Desça lentamente com amplitude confortável.","Evite quicar no final da repetição."],
Abdômen:["Prepare a postura e estabilize a pelve.","Contraia a musculatura abdominal mantendo a respiração.","Execute cada repetição de modo controlado.","Evite puxar com o pescoço ou perder a postura."]
};
function E(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n}
const style=E("style");style.textContent=".atlas-guide-overlay{position:fixed;inset:0;z-index:101;background:#000c;display:flex;align-items:flex-end;justify-content:center}.atlas-guide-sheet{background:#1b2b34;color:#f4f4f0;width:100%;max-width:620px;max-height:90dvh;overflow:auto;border-radius:22px 22px 0 0;padding:20px 18px calc(22px + env(safe-area-inset-bottom))}.atlas-guide-close{float:right;background:#34464f;color:white;border:0;padding:10px;border-radius:9px}.atlas-guide-banner{background:#2c404a;border-radius:13px;padding:20px;text-align:center;margin:16px 0}.atlas-guide-banner strong{color:#dfff00;font-size:17px}.atlas-guide-sheet li{margin:10px 0;line-height:1.5}.atlas-guide-sheet ol{padding-left:23px}.atlas-guide-note{border-left:3px solid #dfff00;padding-left:9px;font-size:13px;color:#cbd6dc}.at-v3-guide-button{background:#2c434d;color:#dfff00;border:1px solid #536c77;border-radius:9px;padding:8px;font-size:12px;cursor:pointer}.at-v3-series-folder{background:#1c3039;border:1px solid #40555e;border-radius:11px;margin:8px 0;padding:8px}.at-v3-series-summary{cursor:pointer;list-style-position:inside;color:#dfff00;font-size:13px;padding:6px}.at-v3-series-folder[open] .at-v3-series-summary{border-bottom:1px solid #40555e;padding-bottom:10px;margin-bottom:9px}";
document.head.append(style);
window.atlasGuide=function(name,muscle){
document.querySelector(".atlas-guide-overlay")?.remove();
const overlay=E("div","atlas-guide-overlay"),panel=E("div","atlas-guide-sheet");
overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Como executar "+name);
const close=E("button","atlas-guide-close","Fechar ×");close.onclick=()=>overlay.remove();panel.append(close);
panel.append(E("h2",null,name));
const banner=E("div","atlas-guide-banner");banner.append(E("strong",null,muscle||"Exercício"),E("p",null,"Guia prático de execução"));panel.append(banner);
const exact=specifics[name],steps=exact||guides[muscle];
if(steps){panel.append(E("h3",null,exact?"Passo a passo":"Orientações gerais para o grupo muscular"));const list=E("ol");steps.slice(0,3).forEach(s=>list.append(E("li",null,s)));panel.append(list,E("p","atlas-guide-note","Atenção: "+steps[3]));}
else panel.append(E("p","atlas-guide-note","Exercício personalizado: ainda não existe uma demonstração ou orientação específica validada. Peça orientação a um profissional."));
panel.append(E("p","muted","Guia educativo em texto. Uma demonstração em vídeo licenciada poderá ser adicionada futuramente. Interrompa se sentir dor aguda."));
overlay.append(panel);overlay.onclick=e=>{if(e.target===overlay)overlay.remove()};document.body.append(overlay);close.focus();
};
})();