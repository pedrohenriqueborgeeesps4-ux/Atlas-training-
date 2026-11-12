"use strict";
(function () {
  const make = (tag, text, cls) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };
  const button = (text, action, cls = "btn alt") => {
    const node = make("button", text, cls);
    node.type = "button";
    node.onclick = action;
    return node;
  };
  const main = document.querySelector("main");
  const page = (id, title) => {
    const section = make("section", undefined, "page atlas-page");
    section.id = id;
    section.hidden = true;
    section.append(make("h2", title));
    main.insertBefore(section, document.getElementById("status"));
    return section;
  };
  const training = page("routines", "Treino");
  const catalog = page("catalog", "Exercícios");
  const profile = page("profile", "Seu perfil");
  const originalGo = go;
  const positions = new Map();
  const preferences = page("preferences", "Configurações");
  let currentPage = "home";
  go = function (id) {
    positions.set(currentPage, window.scrollY);
    originalGo(id);
    currentPage = id;
    document.body.dataset.screen = id;
    document.body.classList.toggle("atlas-in-workout", id === "workout");
    const navId = ["workout", "routines", "catalog"].includes(id) ? "routines" : ["settings", "progress", "attendance", "profile", "preferences"].includes(id) ? "profile" : "home";
    document.querySelectorAll("nav [data-page]").forEach(node => {
      node.classList.toggle("active", node.dataset.page === navId);
      node.setAttribute("aria-current", node.dataset.page === navId ? "page" : "false");
    });
    if (id === "home") renderHome();
    if (id === "routines") renderRoutines();
    if (id === "profile") renderProfile();
    if (id === "catalog") renderCatalog();
    if (id === "progress") window.atlasRefreshAnalytics?.();
    window.scrollTo(0, positions.get(id) || 0);
  };
  const nav = document.querySelector("nav");
  nav.replaceChildren();
  [["home", "⌂", "Início"], ["routines", "▤", "Treino"], ["profile", "○", "Perfil"]].forEach(([id, icon, label]) => {
    const node = button("", () => go(id), "");
    node.dataset.page = id;
    node.append(make("b", icon), document.createTextNode(label));
    nav.append(node);
  });
  ["settings", "progress", "attendance"].forEach(id => {
    document.getElementById(id).prepend(button("← Perfil", () => go("profile"), "atlas-back"));
  });
  document.getElementById("workout").prepend(button("← Minhas rotinas", () => go("routines"), "atlas-back"));
  document.querySelector("header h1").textContent = "Atlas Training";
  document.querySelector("header small.accent").textContent = "";
  document.querySelector("header > span").remove();
  const homeAction = document.querySelector('#home [data-page="workout"]');
  homeAction.textContent = "Escolher treino";
  homeAction.onclick = () => go("routines");
  const workout = document.getElementById("workout");
  const selector = make("details", undefined, "atlas-workout-settings");
  selector.append(make("summary", "Editar rotina"));
  const dayButtons = document.getElementById("dayButtons");
  dayButtons.before(selector);
  selector.append(dayButtons, workout.querySelector(".at-v2-toolbar"));
  const workoutHeading = document.getElementById("exerciseList").parentElement.querySelector("h2");
  const renderWorkout = renderExercises;
  renderExercises = function () {
    renderWorkout();
    workoutHeading.textContent = routine[selected]?.title || "Seu treino";
  };
  if(Number.isInteger(db.activeRoutine)&&routine[db.activeRoutine])selected=db.activeRoutine;
  renderDays();renderExercises();
  const timerCard = document.getElementById("sessionClock").parentElement;
  timerCard.classList.add("atlas-session-timer");
  const timerOptions = make("details", undefined, "atlas-timer-options");
  timerOptions.append(make("summary", "Controles"), timerCard.querySelector(".row"));
  timerCard.append(timerOptions);
  document.getElementById("restClock").parentElement.hidden = true;
  const home = document.getElementById("home");
  homeAction.closest(".card").classList.add("atlas-home-start");
  home.prepend(homeAction.closest(".card"));
  const guide = window.atlasGuide;
  window.atlasGuide = function (name, muscle) {
    const opener = document.activeElement;
    guide(name, muscle);
    const overlay = document.querySelector(".atlas-guide-overlay");
    const panel = overlay.querySelector(".atlas-guide-sheet");
    const close = panel.querySelector(".atlas-guide-close");
    const heading = panel.querySelector("h2");
    const instructions = make("div");
    [...panel.children].filter(node => node !== close && node !== heading).forEach(node => instructions.append(node));
    const content = make("div");
    const tabs = make("div", undefined, "atlas-tabs");
    const rows = window.atlasV2.historyRecords(name);
    const noteLabel = make("label", "Nota pessoal fixada");
    const note = make("textarea", undefined, "field");
    note.id = "atlas-detail-note";
    noteLabel.htmlFor = note.id;
    note.maxLength = 400;
    note.value = db.exerciseNotes[name] || "";
    note.oninput = () => {
      db.exerciseNotes[name] = note.value;
      persist();
      document.querySelectorAll("#exerciseList .exercise").forEach(exercise => {
        if (exercise.querySelector("h3")?.textContent === name) exercise.querySelector("textarea").value = note.value;
      });
    };
    instructions.append(noteLabel, note);
    const panels = {"Resumo": make("div"), "Histórico": make("div"), "Instruções": instructions};
    const summary = panels.Resumo;
    summary.append(make("p", muscle, "accent"));
    const independent = rows.flatMap(row => row.sets).filter(set => set.assisted !== true && set.type !== "aquecimento");
    const best = independent.length ? Math.max(...independent.map(set => Number(set.kg) || 0)) : null;
    summary.append(make("div", best === null ? "Sem recorde registrado" : best + " kg", "metric"), make("p", "Maior carga sem auxílio", "muted"));
    summary.append(make("p", rows.length + " sessões registradas"));
    if (rows.length) {
      const chart = make("div", undefined, "atlas-bars");
      const values = rows.slice(-10).map(row => ({date: row.date, value: Math.max(0, ...row.sets.filter(set => set.assisted !== true && set.type !== "aquecimento").map(set => Number(set.kg) || 0))}));
      drawBars(chart, values, "kg");
      summary.append(chart, make("p", "Carga máxima sem auxílio por sessão", "muted"));
    }
    const history = panels.Histórico;
    if (!rows.length) history.append(make("p", "Seu histórico aparecerá aqui quando você salvar um treino com este exercício.", "muted"));
    rows.slice().reverse().forEach(row => {
      const card = make("div", undefined, "card");
      card.append(make("h3", new Date(row.date).toLocaleDateString("pt-BR")));
      row.sets.forEach(set => card.append(make("p", "Série " + set.set + " · " + (set.kg ?? "—") + " kg × " + (set.reps ?? "—") + " reps" + (set.assisted ? " · 🤝" : "") + (set.rpe ? " · RPE " + set.rpe : ""))));
      history.append(card);
    });
    Object.entries(panels).forEach(([label, body]) => {
      const tab = button(label, () => {
        Object.values(panels).forEach(node => node.hidden = node !== body);
        [...tabs.children].forEach(node => node.setAttribute("aria-selected", String(node === tab)));
      }, "atlas-tab");
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(label === "Resumo"));
      body.hidden = label !== "Resumo";
      tabs.append(tab);
      content.append(body);
    });
    tabs.setAttribute("role", "tablist");
    panel.append(tabs, content);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function dismiss() {
      document.body.style.overflow = oldOverflow;
      overlay.remove();
      opener?.focus({preventScroll: true});
    }
    close.onclick = dismiss;
    overlay.onclick = event => { if (event.target === overlay) dismiss(); };
    overlay.onkeydown = event => {
      if (event.key === "Escape") dismiss();
      if (event.key !== "Tab") return;
      const focusable = [...panel.querySelectorAll("button, textarea")].filter(node => node.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    };
  };
  function drawBars(parent, values, unit) {
    const max = Math.max(1, ...values.map(item => item.value));
    values.forEach(item => {
      const column = make("div", undefined, "atlas-bar-column");
      const bar = make("div", undefined, "atlas-bar");
      bar.style.height = Math.max(2, item.value / max * 100) + "px";
      const date = new Date(item.date).toLocaleDateString("pt-BR", {day:"2-digit", month:"2-digit"});
      column.title = date + " · " + item.value.toLocaleString("pt-BR", {maximumFractionDigits:1}) + " " + unit;
      column.append(make("small", item.value.toLocaleString("pt-BR", {maximumFractionDigits:1})), bar, make("small", date));
      parent.append(column);
    });
  }
  function allExercises() {
    const entries = window.atlasV2.library.map(([name, muscle, equipment]) => ({name, muscle, equipment}));
    entries.push(...db.customExercises);
    return entries;
  }
  function selectField(label, values, value) {
    const wrapper = make("label", label);
    const select = make("select", undefined, "field");
    values.forEach(text => { const option = make("option", text); option.value = text; select.append(option); });
    if (values.includes(value)) select.value = value;
    wrapper.append(select);
    return {wrapper, select};
  }
  const search = make("input", undefined, "field");
  search.type = "search";
  search.placeholder = "Buscar exercício";
  search.setAttribute("aria-label", "Buscar exercício");
  const muscleFilter = selectField("Grupo muscular", ["Todos", ...new Set(allExercises().map(item => item.muscle))]);
  const equipmentFilter = selectField("Equipamento", ["Todos", ...new Set(allExercises().map(item => item.equipment))]);
  const filters = make("div", undefined, "grid");
  filters.append(muscleFilter.wrapper, equipmentFilter.wrapper);
  const results = make("div");
  const count = make("p", "", "muted");
  count.setAttribute("aria-live", "polite");
  catalog.append(search, filters, count, results);
  catalog.prepend(button("← Treino", () => go("routines"), "atlas-back"));
  [search, muscleFilter.select, equipmentFilter.select].forEach(node => node.addEventListener("input", renderCatalog));
  const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  function renderCatalog() {
    results.replaceChildren();
    const items = allExercises().filter(item => normalize(item.name).includes(normalize(search.value)) && (muscleFilter.select.value === "Todos" || item.muscle === muscleFilter.select.value) && (equipmentFilter.select.value === "Todos" || item.equipment === equipmentFilter.select.value));
    count.textContent = items.length + " exercícios";
    items.forEach(item => {
      const row = button("", () => window.atlasGuide(item.name, item.muscle), "atlas-list-button");
      row.append(make("strong", item.name), make("small", item.muscle + " · " + item.equipment));
      results.append(row);
    });
    if (!items.length) results.append(make("p", "Nenhum exercício com esses filtros. Tente outro nome ou equipamento.", "muted"));
  }
  let routineTab = "Rotinas";
  let builder = null;
  let previewIndex = null;
  function discardCurrentWorkout() {
    const index = Number.isInteger(db.activeRoutine) ? db.activeRoutine : selected;
    const title = routine[index]?.title || "Treino";
    if (!confirm('Sair de "' + title + '" sem concluir?\nAs séries e observações desta sessão serão descartadas. A rotina e o histórico salvo serão mantidos. Nenhuma presença será registrada.')) return false;
    const next = {...db, drafts:{...db.drafts}, workoutNotes:{...db.workoutNotes}, timer:{elapsed:0,startedAt:null}};
    delete next.drafts[index];
    delete next.workoutNotes[index];
    delete next.activeRoutine;
    try { localStorage.setItem(STORE, JSON.stringify(next)); }
    catch { notice("Não foi possível encerrar o treino. Tente novamente."); return false; }
    db = next;
    restEnd = 0;
    clearInterval(restTimer);
    document.getElementById("restClock").textContent = "00:00";
    const floating=document.getElementById("atlas-floating-rest");
    if(floating){floating.hidden=true;floating.querySelector("strong").textContent="00:00";}
    showClock();
    renderDays(); renderExercises();
    return true;
  }
  const discardButton=button("✕ Sair sem concluir",()=>{
    if(!discardCurrentWorkout())return;
    previewIndex=null;routineTab="Rotinas";go("routines");
    notice("Sessão descartada. Escolha o treino que deseja iniciar.");
  },"btn atlas-discard-workout");
  discardButton.id="discardWorkout";
  document.querySelector("#workout > .atlas-back").after(discardButton);
  function openRoutine(index) {
    if (Number.isInteger(db.activeRoutine) && db.activeRoutine !== index && routine[db.activeRoutine]) {
      if (!discardCurrentWorkout()) return;
    }
    selected = index;
    db.activeRoutine = index;
    if (!db.timer.startedAt) db.timer.startedAt = Date.now();
    persist(); renderDays(); renderExercises(); showClock(); go("workout");
  }
  function startBuilder(seed) {
    builder = seed || {step:0,name:"",muscle:"Todos",equipment:"Todos",query:"",ex:[]};
    routineTab="Montar"; previewIndex=null; go("routines");
  }
  function routinePreview(index) {
    previewIndex=index; renderRoutines(); window.scrollTo(0,0);
  }
  function deleteRoutine(index) {
    const item = routine[index];
    if (!item) return;
    if (db.activeRoutine === index) {
      notice("Conclua o treino ou use “Sair sem concluir” antes de apagar esta rotina.");
      return;
    }
    const pending = Object.keys(db.drafts[index] || {}).length > 0;
    if (!confirm('Apagar a rotina "' + item.title + '"?' +
      (pending ? "\nAs séries ainda não salvas desta ficha também serão apagadas." : "") +
      "\nSeu histórico de treinos concluídos será mantido.")) return;
    const reindex = source => Object.fromEntries(Object.entries(source || {})
      .filter(([key]) => Number(key) !== index)
      .map(([key, value]) => [Number(key) > index ? Number(key) - 1 : key, value]));
    const sessions = db.sessions.map(session => ({
      ...session,
      routineTitle: session.routineTitle || routine[session.day]?.title || "Treino",
      day: session.day === index ? null : session.day > index ? session.day - 1 : session.day
    }));
    const templates = routine.filter((_, i) => i !== index);
    const next = {...db, templates, sessions, drafts: reindex(db.drafts), workoutNotes: reindex(db.workoutNotes)};
    if (Number.isInteger(next.activeRoutine) && next.activeRoutine > index) next.activeRoutine--;
    try { localStorage.setItem(STORE, JSON.stringify(next)); }
    catch { notice("Não foi possível apagar a rotina. Tente novamente."); return; }
    db = next;
    routine.splice(0, routine.length, ...templates);
    selected = selected > index ? selected - 1 : selected === index ? Math.min(index, Math.max(0, routine.length - 1)) : selected;
    previewIndex = null;
    builder = null;
    renderDays(); renderExercises(); renderRoutines();
    notice("Rotina apagada. Seu histórico foi preservado.");
  }
  function renderRoutines() {
    training.replaceChildren(make("h2", "Treino"));
    if (routineTab === "Montar") {renderBuilder();return;}
    if (previewIndex !== null && routine[previewIndex]) {
      const item=routine[previewIndex], index=previewIndex;
      training.append(button("← Rotinas",()=>{previewIndex=null;renderRoutines();},"atlas-back"));
      training.append(make("h2",item.title),make("p", "🏋️ "+item.ex.length+" exercícios · "+item.ex.reduce((n,ex)=>n+ex[1],0)+" séries","muted"));
      const actions=make("div",undefined,"atlas-routine-actions");
      actions.append(button("▶ Iniciar treino",()=>openRoutine(index),"btn"),button("✏️ Editar",()=>{
        if(Object.keys(db.drafts[index]||{}).length || db.activeRoutine===index){notice("Conclua o treino ou use “Sair sem concluir” antes de editar a rotina.");return;}
        startBuilder({step:2,name:item.title,muscle:"Todos",equipment:"Todos",query:"",ex:item.ex.map(x=>x.slice()),edit:index});
      })); training.append(actions);
      item.ex.forEach(([name,sets,reps],i)=>{
        const row=button("",()=>window.atlasGuide(name,window.atlasV2.muscleFor(name)),"atlas-list-button");
        row.append(make("span","🏋️","atlas-exercise-index"),make("strong",name),make("small","🔁 "+sets+" séries · "+reps+" reps")); training.append(row);
      });
      const more=make("details",undefined,"atlas-more");more.append(make("summary","Opções da rotina"));
      more.append(button("📤 Exportar treino",()=>downloadRoutine(item)),button("📋 Duplicar rotina",()=>{
        routine.push({day:"Extra",title:item.title+" (cópia)",ex:item.ex.map(x=>x.slice())});window.atlasV2.saveTemplates();previewIndex=null;renderRoutines();notice("Rotina duplicada.");
      })); training.append(more,button("🗑️ Apagar rotina",()=>deleteRoutine(index),"btn atlas-delete-routine"));return;
    }
    const tabs=make("div",undefined,"atlas-tabs");
    ["Rotinas","Montar","Explorar"].forEach(label=>{
      const tab=button(label,()=>{if(label==="Montar"){startBuilder();return;}routineTab=label;previewIndex=null;renderRoutines();},"atlas-tab");
      tab.setAttribute("aria-pressed",String(routineTab===label)); tabs.append(tab);
    }); training.append(tabs);
    if(routineTab==="Explorar") {
      training.append(make("h3","Encontre seus exercícios"),make("p","Explore por equipamento e consulte a execução e seu histórico.","muted"));
      const groups=make("div",undefined,"atlas-equipment-grid");
      [["Peso corporal","Em casa"],["Halteres","Com halteres"],["Barra","Com barra"],["Máquina","Máquinas"],["Cabo","Polias"],["Todos","Biblioteca completa"]].forEach(([equipment,label],i)=>{
        const tile=button("",()=>{equipmentFilter.select.value=equipment;muscleFilter.select.value="Todos";search.value="";go("catalog");},"atlas-equipment");
        tile.append(make("span",["⌂","Ⅱ","━","▥","↕","＋"][i],"atlas-equipment-icon"),make("strong",label),make("small","Ver exercícios →"));groups.append(tile);
      });training.append(groups,button("Montar uma rotina",()=>startBuilder(),"btn atlas-full"));return;
    }
    training.append(button("+ Nova rotina",()=>startBuilder(),"btn atlas-full"));
    const subtitle=make("div",undefined,"row between atlas-section-heading");subtitle.append(make("h3","Minhas rotinas"),button("Importar",()=>importRoutine.click(),"atlas-back"));training.append(subtitle);
    if(!routine.length){const empty=make("div",undefined,"atlas-empty");empty.append(make("div","▤","atlas-empty-icon"),make("h3","Seu próximo treino começa aqui"),make("p","Crie sua rotina ou importe um arquivo do Atlas. Você escolhe os exercícios, séries e repetições.","muted"));training.append(empty);}
    routine.forEach((item,index)=>{
      const card=make("div",undefined,"card atlas-routine-card");
      const title=button(item.title,()=>routinePreview(index),"atlas-routine-title");
      const pending=Object.keys(db.drafts[index]||{}).length>0||db.activeRoutine===index;
      card.append(title,make("p", "🏋️ "+item.ex.length+" exercícios · "+item.ex.reduce((sum,ex)=>sum+Number(ex[1]),0)+" séries","muted"));
      card.append(make("p",item.ex.slice(0,3).map(x=>x[0]).join(" · ")+(item.ex.length>3?"…":""),"atlas-routine-description"));
      const actions=make("div",undefined,"row");actions.append(button(pending?"▶ Continuar treino":"▶ Iniciar treino",()=>openRoutine(index),"btn"),button("📋 Ver rotina",()=>routinePreview(index),"btn alt"));card.append(actions);training.append(card);
    });
    training.append(button("Biblioteca de exercícios →",()=>go("catalog"),"atlas-list-button"));
  }
  function renderBuilder() {
    builder ||= {step:0,name:"",muscle:"Todos",equipment:"Todos",query:"",ex:[]};
    const draft=builder;
    training.append(button("← "+(draft.step?"Voltar":"Rotinas"),()=>{if(draft.step){draft.step--;renderRoutines();}else{routineTab="Rotinas";renderRoutines();}},"atlas-back"));
    training.append(make("p","ETAPA "+(draft.step+1)+" DE 3","atlas-eyebrow"));
    const steps=make("div",undefined,"atlas-steps");[0,1,2].forEach(i=>steps.append(make("span","",i<=draft.step?"active":"")));training.append(steps);
    training.append(make("h2",["Dê um nome à sua rotina","Escolha os exercícios","Revise sua rotina"][draft.step]));
    const form=make("form",undefined,"atlas-builder");training.append(form);
    if(draft.step===0){
      const label=make("label","Nome da rotina");const name=make("input",undefined,"field");name.required=true;name.maxLength=70;name.value=draft.name;name.placeholder="Ex.: Superiores A";name.oninput=()=>draft.name=name.value;label.append(name);
      const target=selectField("Grupo muscular",["Todos",...new Set(allExercises().map(x=>x.muscle))],draft.muscle);
      const equipment=selectField("Equipamento",["Todos",...new Set(allExercises().map(x=>x.equipment))],draft.equipment);
      target.select.onchange=()=>draft.muscle=target.select.value;equipment.select.onchange=()=>draft.equipment=equipment.select.value;
      form.append(label,target.wrapper,equipment.wrapper,make("p","Os filtros ajudam a buscar. Você pode combinar equipamentos e grupos na próxima etapa.","muted"));
    }else if(draft.step===1){
      const query=make("input",undefined,"field");query.type="search";query.placeholder="Buscar exercício";query.setAttribute("aria-label","Buscar exercícios para rotina");query.value=draft.query;
      const target=selectField("Grupo",["Todos",...new Set(allExercises().map(x=>x.muscle))],draft.muscle);
      const equipment=selectField("Equipamento",["Todos",...new Set(allExercises().map(x=>x.equipment))],draft.equipment);
      const filters=make("div",undefined,"grid");filters.append(target.wrapper,equipment.wrapper);
      const count=make("p","","accent");count.setAttribute("aria-live","polite");
      const list=make("div",undefined,"atlas-picker-list");
      function refresh(){list.replaceChildren();count.textContent=draft.ex.length+" exercícios selecionados";
        allExercises().filter(item=>normalize(item.name).includes(normalize(draft.query))&&(draft.muscle==="Todos"||item.muscle===draft.muscle)&&(draft.equipment==="Todos"||item.equipment===draft.equipment)).forEach(item=>{
          const row=make("label",undefined,"atlas-choice");const check=make("input");check.type="checkbox";check.checked=draft.ex.some(x=>x[0]===item.name);
          check.onchange=()=>{if(check.checked)draft.ex.push([item.name,3,"8–12"]);else draft.ex=draft.ex.filter(x=>x[0]!==item.name);count.textContent=draft.ex.length+" exercícios selecionados";};
          const text=make("span");text.append(make("strong",item.name),make("small",item.muscle+" · "+item.equipment));row.append(check,text);list.append(row);
        });if(!list.children.length)list.append(make("p","Nenhum exercício encontrado. Ajuste os filtros.","muted"));
      }
      query.oninput=()=>{draft.query=query.value;refresh();};target.select.onchange=()=>{draft.muscle=target.select.value;refresh();};equipment.select.onchange=()=>{draft.equipment=equipment.select.value;refresh();};
      form.append(query,filters,count,list);refresh();
    }else{
      form.append(make("h3",draft.name),make("p","Ajuste séries, repetições e ordem antes de salvar.","muted"));
      draft.ex.forEach((ex,i)=>{
        const card=make("div",undefined,"card atlas-review-exercise");card.append(make("h3",ex[0]));
        const fields=make("div",undefined,"grid");const setsLabel=make("label","Séries"),repsLabel=make("label","Repetições");
        const sets=make("input",undefined,"field");sets.type="number";sets.min=1;sets.max=15;sets.required=true;sets.value=ex[1];sets.oninput=()=>ex[1]=Number(sets.value);
        const reps=make("input",undefined,"field");reps.required=true;reps.maxLength=40;reps.value=ex[2];reps.oninput=()=>ex[2]=reps.value;setsLabel.append(sets);repsLabel.append(reps);fields.append(setsLabel,repsLabel);card.append(fields);
        const actions=make("div",undefined,"row");[-1,1].forEach(dir=>{const move=button(dir===-1?"↑ Subir":"↓ Descer",()=>{const j=i+dir;if(j<0||j>=draft.ex.length)return;[draft.ex[i],draft.ex[j]]=[draft.ex[j],draft.ex[i]];renderRoutines();},"atlas-back");move.disabled=i+dir<0||i+dir>=draft.ex.length;actions.append(move);});
        actions.append(button("Remover",()=>{draft.ex.splice(i,1);renderRoutines();},"atlas-back"));card.append(actions);form.append(card);
      });
      form.append(button("+ Adicionar exercícios",()=>{draft.step=1;renderRoutines();},"atlas-list-button"));
    }
    const next=make("button",draft.step===2?"Salvar rotina":"Continuar","btn atlas-full atlas-builder-next");next.type="submit";form.append(next);
    form.onsubmit=event=>{event.preventDefault();
      if(draft.step===0&&!draft.name.trim())return;
      if(draft.step===1&&!draft.ex.length){notice("Selecione pelo menos um exercício.");return;}
      if(draft.step<2){draft.step++;renderRoutines();window.scrollTo(0,0);return;}
      if(!draft.ex.length||draft.ex.some(x=>!Number.isInteger(x[1])||x[1]<1||x[1]>15||!x[2].trim())){notice("Confira as séries e repetições.");return;}
      const item={day:"Extra",title:draft.name.trim(),ex:draft.ex.map(x=>x.slice())};
      if(Number.isInteger(draft.edit))routine[draft.edit]=item;else routine.push(item);
      previewIndex=Number.isInteger(draft.edit)?draft.edit:routine.length-1;
      window.atlasV2.saveTemplates();builder=null;routineTab="Rotinas";renderRoutines();window.scrollTo(0,0);notice("Rotina salva.");
    };
  }
  let profileMetric = "Duração";
  function renderProfile() {
    profile.replaceChildren(make("h2", db.profile.name || "Seu perfil"));
    const hero=make("div",undefined,"atlas-profile-hero");
    hero.append(make("div",(db.profile.name||"A").slice(0,1).toUpperCase(),"atlas-avatar"));
    [[db.sessions.length,"treinos"],[routine.length,"rotinas"],[db.profile.frequency||"—","meta semanal"]].forEach(([value,label])=>{const stat=make("div");stat.append(make("strong",String(value)),make("small",label));hero.append(stat);});
    profile.append(hero,button("Configurações",()=>go("preferences"),"atlas-back"));
    const actions = make("div", undefined, "grid");
    [["Editar perfil", "settings"], ["Estatísticas", "progress"], ["Exercícios", "catalog"], ["Calendário", "attendance"]].forEach(([label,id]) => actions.append(button(label, () => go(id))));
    actions.append(button("Medidas", () => {go("progress"); document.getElementById("waist").closest(".card").scrollIntoView();}));
    profile.append(actions);
    const chartCard = make("div", undefined, "card");
    chartCard.append(make("h3", "Seu ritmo de treino"));
    const tabs = make("div", undefined, "atlas-tabs");
    ["Duração", "Volume", "Repetições"].forEach(label => {
      const tab = button(label, () => {profileMetric = label; renderProfile();}, "atlas-tab");
      tab.setAttribute("aria-pressed", String(profileMetric === label)); tabs.append(tab);
    });
    const chart = make("div", undefined, "atlas-bars");
    const sessions = db.sessions.slice(-8);
    const explanations = {
      "Duração":"⏱️ Tempo registrado no cronômetro de cada treino, em minutos.",
      "Volume":"🏋️ Carga acumulada: somamos carga × repetições de cada série. Ex.: 20 kg × 10 repetições = 200 kg. Não é o peso levantado de uma vez nem uma medida de esforço.",
      "Repetições":"🔁 Total de repetições de todos os exercícios daquele treino. Ex.: 3 séries de 10 = 30 repetições."
    };
    chartCard.append(tabs,make("p",explanations[profileMetric],"muted"));
    if(profileMetric!=="Duração")chartCard.append(make("p","Séries de aquecimento ficam fora desta soma; séries com ajuda entram. Carga não preenchida não acrescenta volume.","muted"));
    const detail=make("div",undefined,"atlas-chart-detail");
    function showSession(session){
      detail.replaceChildren(make("h3",session.routineTitle||routine[session.day]?.title||"Treino"),make("p",new Date(session.date).toLocaleString("pt-BR")));
      const sets=(session.sets||[]).filter(x=>x.type!=="aquecimento");
      detail.append(make("p","⏱️ "+Math.round((session.seconds||0)/60)+" min · "+sets.length+" séries sem aquecimento"));
      const breakdown=make("details");breakdown.append(make("summary","Ver como o total foi calculado"));
      [...new Set(sets.map(x=>x.name))].forEach(name=>{
        const group=sets.filter(x=>x.name===name);
        const reps=group.reduce((n,x)=>n+(Number(x.reps)||0),0);
        const volume=group.reduce((n,x)=>n+(Number(x.kg)||0)*(Number(x.reps)||0),0);
        breakdown.append(make("p",name+" · "+reps+" repetições · "+volume.toLocaleString("pt-BR")+" kg acumulados"));
      });
      detail.append(breakdown);
    }
    const values=sessions.map(session=>{
      const sets=(session.sets||[]).filter(set=>set.type!=="aquecimento");
      return {date:session.date,value:profileMetric==="Duração"?(session.seconds||0)/60:sets.reduce((sum,set)=>sum+(Number(set.reps)||0)*(profileMetric==="Volume"?Number(set.kg)||0:1),0)};
    });
    if(values.length){
      const unit=profileMetric==="Duração"?"min":profileMetric==="Volume"?"kg acumulados":"repetições";
      drawBars(chart,values,unit);
      [...chart.children].forEach((column,i)=>{
        const session=sessions[i],title=session.routineTitle||routine[session.day]?.title||"Treino";
        const choice=button(title,()=>showSession(session),"atlas-chart-choice");
        choice.setAttribute("aria-label",title+", "+new Date(session.date).toLocaleDateString("pt-BR")+", "+values[i].value.toLocaleString("pt-BR",{maximumFractionDigits:1})+" "+unit+". Ver detalhes");
        choice.append(...column.childNodes);column.append(choice);
        column.onclick=()=>showSession(session);
      });
      chartCard.append(make("p","Cada barra é um treino. Toque no nome para ver os detalhes. Últimos "+values.length+" treinos.","muted"),chart,detail);
      showSession(sessions.at(-1));
    }else chartCard.append(make("p","Seus gráficos aparecem após salvar o primeiro treino.","muted"));
    profile.insertBefore(chartCard, actions);
    profile.append(make("h3", "Treinos recentes"));
    if (!db.sessions.length) profile.append(button("Escolher meu treino", () => go("routines"), "btn"));
    db.sessions.slice(-10).reverse().forEach(session => {
      const card = make("details", undefined, "card");
      card.append(make("summary", (session.routineTitle || routine[session.day]?.title || "Treino") + " · " + new Date(session.date).toLocaleDateString("pt-BR")));
      card.append(make("p", format(session.seconds || 0) + " · " + (session.sets || []).length + " séries"));
      [...new Set((session.sets || []).map(set => set.name))].forEach(name => card.append(button(name, () => window.atlasGuide(name, window.atlasV2.muscleFor(name)), "atlas-list-button")));
      profile.append(card);
    });
  }
  const profileCard = document.querySelector("#settings .card");
  const nameLabel = make("label", "Como você quer ser chamado?");
  const nameInput = make("input", undefined, "field"); nameInput.maxLength = 50; nameInput.value = db.profile.name || ""; nameLabel.append(nameInput);
  const objective = selectField("Objetivo", ["Escolher depois", "Ganhar massa muscular", "Ganhar força", "Condicionamento"], db.profile.objective);
  const experience = selectField("Experiência", ["Escolher depois", "Iniciante", "Intermediário", "Avançado"], db.profile.experience);
  profileCard.append(nameLabel, objective.wrapper, experience.wrapper, button("Salvar perfil", () => {
    db.profile = {...db.profile, name:nameInput.value.trim(), objective:objective.select.value, experience:experience.select.value};
    persist(); notice("Perfil atualizado.");
  }, "btn"));
  // Keep existing metric elements and their event handlers in the progress page.
  [...home.children].forEach(node => document.getElementById("progress").append(node));
  ["weightHistory","sessionHistory","measureHistory"].forEach(id=>{
    const content=document.getElementById(id);
    const fold=make("details",undefined,"atlas-history-section");
    const title=id==="weightHistory"?"⚖️ Histórico de peso":id==="sessionHistory"?"🏋️ Histórico de treinos e cargas":"📏 Histórico de medidas";
    fold.append(make("summary",title));
    if(id!=="measureHistory")content.parentElement.querySelector("h2")?.remove();
    content.before(fold);fold.append(content);
  });
  home.replaceChildren();
  function sessionCard(session) {
    const card=make("div",undefined,"card atlas-session-card");
    card.append(make("small",new Date(session.date).toLocaleDateString("pt-BR",{day:"numeric",month:"long"})),make("h3",session.routineTitle||routine[session.day]?.title||"Treino"));
    const sets=session.sets||[];
    const volume=sets.filter(x=>x.type!=="aquecimento").reduce((n,x)=>n+(Number(x.kg)||0)*(Number(x.reps)||0),0);
    card.append(make("p",Math.round((session.seconds||0)/60)+" min · "+volume.toLocaleString("pt-BR")+" kg acumulados · "+sets.length+" séries","accent"));
    const detail=make("details");detail.append(make("summary","Ver exercícios"));
    [...new Set(sets.map(x=>x.name))].forEach(name=>detail.append(button(name,()=>window.atlasGuide(name,window.atlasV2.muscleFor(name)),"atlas-list-button")));
    card.append(detail);return card;
  }
  function renderHome() {
    home.replaceChildren(importRoutine);
    home.append(make("h2",db.profile.name?"Olá, "+db.profile.name:"Seu espaço de treino"));
    if(!routine.length&&!db.sessions.length){
      const welcome=make("div",undefined,"card atlas-welcome");
      welcome.append(make("p","COMECE NO SEU RITMO","atlas-eyebrow"),make("h2","Um treino do seu jeito."),make("p","Monte sua primeira rotina ou traga um treino que você já tem.","muted"),button("Criar minha rotina",()=>startBuilder(),"btn"),button("Importar treino",()=>importRoutine.click(),"btn alt"),button("Configurar meu perfil →",()=>go("settings"),"atlas-back"));home.append(welcome);
    }else{
      const active=Number.isInteger(db.activeRoutine)&&routine[db.activeRoutine];
      const hero=make("div",undefined,"card atlas-home-hero");hero.append(make("p",active?"TREINO EM ANDAMENTO":"VAMOS TREINAR?","atlas-eyebrow"),make("h2",active?active.title:"Mais um passo na sua evolução."),button(active?"▶ Continuar treino":"Escolher treino",()=>active?openRoutine(db.activeRoutine):go("routines"),"btn atlas-full"));home.append(hero);
      const start=new Date();start.setHours(0,0,0,0);start.setDate(start.getDate()-(start.getDay()+6)%7);
      const count=db.sessions.filter(x=>new Date(x.date)>=start).length;
      home.append(make("p",count+" treinos nesta semana"+(db.profile.frequency?" · meta de "+db.profile.frequency:""),"muted"));
    }
    const heading=make("div",undefined,"row between atlas-section-heading");heading.append(make("h3","Sua atividade"),button("Calendário",()=>go("attendance"),"atlas-back"));home.append(heading);
    if(db.sessions.length)db.sessions.slice(-5).reverse().forEach(s=>home.append(sessionCard(s)));
    else home.append(make("p","Seus treinos concluídos aparecerão aqui. Os registros ficam neste aparelho.","muted"));
  }
  const importRoutine = make("input");
  importRoutine.type="file"; importRoutine.accept=".json,application/json"; importRoutine.hidden=true;
  home.append(importRoutine);
  function downloadRoutine(item) {
    const data={format:"atlas-routine",version:1,routines:[{title:item.title,ex:item.ex}]};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const link=make("a");link.href=url;link.download="atlas-treino.json";link.click();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  importRoutine.onchange=async () => {
    const file=importRoutine.files[0]; if(!file)return;
    try {
      if(file.size>2000000)throw Error("Use um arquivo de até 2 MB.");
      const data=JSON.parse(await file.text());
      const entries=data.format==="atlas-routine"&&data.version===1?data.routines:data.templates;
      if(!Array.isArray(entries)||!entries.length||entries.length>100)throw Error("O arquivo precisa conter rotinas do Atlas.");
      const imported=entries.map(item => {
        if(!item||typeof item.title!=="string"||!item.title.trim()||item.title.length>100||!Array.isArray(item.ex)||item.ex.length>100)throw Error("Rotina inválida no arquivo.");
        const ex=item.ex.map(entry => {
          if(!Array.isArray(entry)||typeof entry[0]!=="string"||!entry[0].trim()||entry[0].length>100||!Number.isInteger(entry[1])||entry[1]<1||entry[1]>15||typeof entry[2]!=="string"||!entry[2].trim()||entry[2].length>40)throw Error("Exercício inválido no arquivo.");
          return [entry[0].trim(),entry[1],entry[2].trim()];
        });
        return {day:"Extra",title:item.title.trim(),ex};
      });
      if(!confirm("Adicionar "+imported.length+" rotina(s)?\n"+imported.map(item=>item.title).join("\n")))return;
      const next={...db,templates:[...routine,...imported]};
      localStorage.setItem(STORE,JSON.stringify(next));
      db=next;routine.push(...imported);routineTab="Rotinas";previewIndex=null;go("routines");
      notice("Treinos importados. Suas cargas serão registradas durante o treino.");
    }catch(error){notice(error instanceof SyntaxError?"Arquivo JSON inválido.":error.message);}
    finally{importRoutine.value="";}
  };
  const recoveryKey="atlas-before-fresh-start";
  const resetCard=make("div",undefined,"card");
  resetCard.append(make("h3","Começar do zero"),make("p","Abra uma experiência vazia neste aparelho. Uma cópia local dos dados atuais ficará disponível para recuperação.","muted"));
  resetCard.append(button("Começar com perfil vazio",()=>{
    const message=localStorage.getItem(recoveryKey)?"Começar novamente do zero? A cópia anterior será preservada, mas os registros feitos desde o último recomeço serão apagados. Exporte um backup desses registros antes de continuar.":"Começar com perfil e treinos vazios neste aparelho? Seus dados atuais ficarão em uma cópia local recuperável.";
    if(!confirm(message))return;
    try {
      if(!localStorage.getItem(recoveryKey))localStorage.setItem(recoveryKey,JSON.stringify(db));
      localStorage.setItem(STORE,JSON.stringify({weights:[],sessions:[],attendance:{},measures:[],drafts:{},templates:[],profile:{goal:null,frequency:null},timer:{elapsed:0,startedAt:null}}));
      location.reload();
    }catch(error){notice("Não foi possível preparar o perfil vazio. Exporte um backup e tente novamente.");}
  },"btn alt"));
  if(localStorage.getItem(recoveryKey))resetCard.append(button("Recuperar dados anteriores",()=>{
    if(!confirm("Recuperar os dados anteriores? Exporte o perfil atual em backup se quiser guardar os registros feitos depois do recomeço."))return;
    try{const previous=localStorage.getItem(recoveryKey);const current=localStorage.getItem(STORE);localStorage.setItem(STORE,previous);localStorage.setItem(recoveryKey,current);location.reload();}catch(error){notice("Não foi possível recuperar os dados.");}
  },"btn alt"));
  document.getElementById("settings").append(resetCard);
  if(routine.length||db.sessions.length||db.weights.length)home.append(button("Testar do zero neste aparelho",()=>{go("settings");resetCard.scrollIntoView();},"atlas-back"));
  // Dedicated settings routes keep calculators, backup and profile out of the workout.
  const settings=document.getElementById("settings");
  const cards=[...settings.children].filter(node=>node.classList.contains("card"));
  preferences.append(button("← Perfil",()=>go("profile"),"atlas-back"));
  cards.forEach((card,index)=>{
    const label=card.querySelector("h2,h3")?.textContent||"Preferências";
    preferences.append(button(label+" →",()=>{go("settings");cards.forEach(node=>node.hidden=node!==card);window.scrollTo(0,0);},"atlas-list-button"));
  });
  const back=settings.querySelector(".atlas-back");back.textContent="← Configurações";back.onclick=()=>go("preferences");
  const goWithSettings=go;
  go=function(id){if(id==="settings")cards.forEach((card,index)=>card.hidden=index!==0);goWithSettings(id);};
  const finish=document.getElementById("finishWorkout");const saveWorkout=finish.onclick;
  finish.onclick=()=>{
    const before=db.sessions.length;saveWorkout();
    if(db.sessions.length>before){delete db.activeRoutine;restEnd=0;clearInterval(restTimer);document.getElementById("restClock").textContent="00:00";persist();go("home");notice("Treino salvo. Confira o resumo em Sua atividade.");}
  };
  const sessionNotes=document.getElementById("v2-sessionnote");
  const notes=make("details",undefined,"atlas-more");notes.append(make("summary","Observações do treino"));
  sessionNotes.previousElementSibling.remove();sessionNotes.before(notes);notes.append(sessionNotes);
  let noticeTimeout;
  const originalNotice=notice;
  notice=function(message){originalNotice(message);clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>document.getElementById("status").textContent="",6500);};
  go("home");

})();
