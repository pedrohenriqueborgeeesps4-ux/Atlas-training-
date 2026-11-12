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
  let currentPage = "home";
  go = function (id) {
    positions.set(currentPage, window.scrollY);
    originalGo(id);
    currentPage = id;
    document.body.dataset.screen = id;
    document.body.classList.toggle("atlas-in-workout", id === "workout");
    const navId = ["workout", "routines", "catalog"].includes(id) ? "routines" : ["settings", "progress", "attendance", "profile"].includes(id) ? "profile" : "home";
    document.querySelectorAll("nav [data-page]").forEach(node => {
      node.classList.toggle("active", node.dataset.page === navId);
      node.setAttribute("aria-current", node.dataset.page === navId ? "page" : "false");
    });
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
    workoutHeading.textContent = routine[selected].title;
  };
  renderExercises();
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
  const sourceTemplates = window.atlasBaseTemplates.map(item => JSON.parse(JSON.stringify(item)));
  let routineTab = "Minhas rotinas";
  function openRoutine(index) {
    selected = index;
    renderDays();
    renderExercises();
    go("workout");
  }
  function renderRoutines() {
    training.replaceChildren(make("h2", routineTab === "Montar" ? "Nova rotina" : "Meus treinos"));
    const tabs = make("div", undefined, "atlas-tabs");
    ["Minhas rotinas", "Explorar"].forEach(label => {
      const tab = button(label, () => {routineTab = label; renderRoutines();}, "atlas-tab");
      tab.setAttribute("aria-pressed", String(routineTab === label));
      tabs.append(tab);
    });
    if (routineTab === "Montar") {
      training.append(button("← Meus treinos", () => { routineTab = "Minhas rotinas"; renderRoutines(); }, "atlas-back"));
      renderBuilder(); return;
    }
    training.append(tabs);
    if (routineTab === "Explorar") {
      training.append(make("p", "Modelos baseados nas fichas do Atlas. Revise os exercícios antes de adicionar à sua rotina.", "muted"));
      sourceTemplates.forEach(item => {
        const card = make("details", undefined, "card");
        card.append(make("summary", item.title));
        item.ex.forEach(([name, sets, reps]) => card.append(button(name + " · " + sets + " × " + reps, () => window.atlasGuide(name, window.atlasV2.muscleFor(name)), "atlas-list-button")));
        const save = button("Adicionar às minhas rotinas", () => {
          routine.push({day: "Extra", title: item.title, ex: item.ex.map(ex => ex.slice())});
          window.atlasV2.saveTemplates();
          save.disabled = true;
          save.textContent = "Rotina adicionada";
        }, "btn");
        card.append(save);
        training.append(card);
      });
      return;
    }
    const create = button("+ Nova rotina", () => {routineTab = "Montar"; renderRoutines();}, "btn");
    const actions = make("div", undefined, "atlas-routine-actions");
    actions.append(create, button("Exercícios", () => go("catalog"), "btn alt"));
    training.append(actions);
    routine.forEach((item, index) => {
      const card = make("div", undefined, "card atlas-routine-card");
      const pending = Object.values(db.drafts[index] || {}).filter(set => set.done).length;
      card.append(make("h3", item.title), make("p", item.ex.length + " exercícios · " + item.ex.reduce((sum, ex) => sum + Number(ex[1]), 0) + " séries", "muted"));

      card.append(button(pending ? "Continuar treino →" : "Abrir →", () => openRoutine(index), "atlas-open-routine"));
      training.append(card);
    });
  }
  function renderBuilder() {
    const form = make("form", undefined, "card atlas-builder");
    const nameLabel = make("label", "Nome da rotina");
    const name = make("input", undefined, "field");
    name.required = true;
    name.maxLength = 70;
    nameLabel.append(name);
    const target = selectField("Foco da rotina", ["Todos", ...new Set(allExercises().map(item => item.muscle))]);
    const equipment = selectField("Equipamento", ["Todos", ...new Set(allExercises().map(item => item.equipment))]);
    const chosen = new Set();
    const list = make("div", undefined, "atlas-builder-list");
    const preview = make("p", "Selecione os exercícios para revisar sua rotina.", "muted");
    function refresh() {
      list.replaceChildren();
      allExercises().filter(item => (target.select.value === "Todos" || item.muscle === target.select.value) && (equipment.select.value === "Todos" || item.equipment === equipment.select.value)).forEach(item => {
        const label = make("label", undefined, "atlas-choice");
        const check = make("input"); check.type = "checkbox"; check.checked = chosen.has(item.name);
        check.onchange = () => {
          if (check.checked) chosen.add(item.name); else chosen.delete(item.name);
          preview.textContent = chosen.size ? [...chosen].join(" · ") : "Selecione os exercícios para revisar sua rotina.";
        };
        label.append(check, make("span", item.name)); list.append(label);
      });
      if (!list.children.length) list.append(make("p", "Nenhum exercício com esses filtros."));
    }
    target.select.onchange = refresh; equipment.select.onchange = refresh;
    const sets = selectField("Séries iniciais por exercício", ["1", "2", "3", "4", "5"], "3");
    const repsLabel = make("label", "Faixa de repetições");
    const reps = make("input", undefined, "field"); reps.value = "8–12"; reps.maxLength = 20; reps.required = true; repsLabel.append(reps);
    const save = make("button", "Salvar rotina", "btn"); save.type = "submit";
    form.onsubmit = event => {
      event.preventDefault();
      if (!name.value.trim() || !reps.value.trim() || !chosen.size) {preview.textContent = "Preencha o nome, a faixa de repetições e escolha ao menos um exercício."; return;}
      routine.push({day:"Extra", title:name.value.trim(), ex:[...chosen].map(ex => [ex, Number(sets.select.value), reps.value.trim()])});
      window.atlasV2.saveTemplates();
      routineTab = "Minhas rotinas";
      openRoutine(routine.length - 1);
      notice("Rotina criada. Ajuste séries e descanso na ficha quando precisar.");
    };
    form.append(nameLabel, target.wrapper, equipment.wrapper, list, make("h3", "Revisar rotina"), preview, sets.wrapper, repsLabel, save);
    training.append(form); refresh();
  }
  let profileMetric = "Duração";
  function renderProfile() {
    profile.replaceChildren(make("h2", db.profile.name || "Seu perfil"));
    profile.append(make("p", "Perfil e registros salvos neste aparelho", "muted"));
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
    const values = db.sessions.slice(-8).map(session => {
      const sets = (session.sets || []).filter(set => set.type !== "aquecimento");
      const value = profileMetric === "Duração" ? (session.seconds || 0) / 60 : sets.reduce((sum,set) => sum + (Number(set.reps) || 0) * (profileMetric === "Volume" ? Number(set.kg) || 0 : 1),0);
      return {date:session.date, value};
    });
    chartCard.append(tabs);
    if (values.length) {drawBars(chart, values, profileMetric === "Duração" ? "min" : profileMetric === "Volume" ? "kg" : "reps"); chartCard.append(chart, make("p", "Últimos " + values.length + " treinos · " + (profileMetric === "Duração" ? "minutos" : profileMetric === "Volume" ? "carga × repetições, em kg" : "repetições"), "muted"));}
    else chartCard.append(make("p", "Seus gráficos aparecem após salvar o primeiro treino.", "muted"));
    const chartDetails = make("details", undefined, "atlas-profile-chart");
    chartDetails.append(make("summary", "Ver gráficos de evolução"), chartCard);
    profile.append(chartDetails, make("h3", "Treinos recentes"));
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
  go("home");
})();
