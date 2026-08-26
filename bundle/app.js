import { ACCENTS, CASES, CAST, DETECTIVES, getCase, getSuspect } from "./data.js";
import {
  DEFAULT_PROFILE,
  connectEvidence,
  createGame,
  discoverClue,
  evaluateAccusation,
  fallbackReply,
  investigationReadiness,
  normalizeGame,
  recordCustomExchange,
  recordQuestion,
  updateProfileAfterResult,
  useHint,
} from "./game-engine.js";

const STORAGE = {
  profile: "casefile-zero:profile:v1",
  active: "casefile-zero:active:v1",
};

const workspace = document.getElementById("workspace");
const dialogLayer = document.getElementById("dialog-layer");
const toastRegion = document.getElementById("toast-region");
const syncState = document.getElementById("sync-state");
const soundToggle = document.getElementById("sound-toggle");
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

const state = {
  anna: null,
  connected: false,
  profile: { ...DEFAULT_PROFILE },
  game: null,
  boardSelection: [],
  asking: false,
  cleanups: [],
};

let persistenceQueue = Promise.resolve();

class Soundscape {
  constructor() {
    this.context = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.enabled = true;
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled) this.stopAmbient();
    else this.startAmbient();
  }

  async ensure() {
    if (!this.enabled) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  async play(kind = "ui") {
    const context = await this.ensure();
    if (!context) return;
    const map = {
      ui: { notes: [260], duration: .045, gain: .022, type: "sine" },
      paper: { notes: [160, 215], duration: .11, gain: .028, type: "triangle" },
      clue: { notes: [392, 523, 659], duration: .32, gain: .045, type: "sine" },
      deduction: { notes: [196, 293, 440, 587], duration: .55, gain: .05, type: "triangle" },
      warning: { notes: [174, 146], duration: .38, gain: .045, type: "sawtooth" },
      solved: { notes: [196, 247, 294, 392, 494, 587], duration: 1.05, gain: .06, type: "triangle" },
    };
    const cue = map[kind] || map.ui;
    const start = context.currentTime;
    cue.notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const offset = index * Math.min(.11, cue.duration / Math.max(2, cue.notes.length));
      oscillator.type = cue.type;
      oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(cue.gain, start + offset + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, start + cue.duration + offset);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + cue.duration + offset + .03);
    });
  }

  async startAmbient() {
    const context = await this.ensure();
    if (!context || this.ambientNode || !this.enabled) return;
    const seconds = 2;
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < channel.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * .985 + white * .015;
      channel[index] = last * .7;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "bandpass";
    filter.frequency.value = 520;
    filter.Q.value = .35;
    gain.gain.value = .018;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    this.ambientNode = source;
    this.ambientGain = gain;
  }

  stopAmbient() {
    try { this.ambientNode?.stop(); } catch { /* already stopped */ }
    this.ambientNode = null;
    this.ambientGain = null;
  }
}

const sound = new Soundscape();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function routeParts() {
  return (location.hash.replace(/^#\/?/, "") || "desk").split("/").filter(Boolean);
}

function navigate(path) {
  location.hash = `#/${path.replace(/^\//, "")}`;
}

function activeCase() {
  return state.game ? getCase(state.game.caseId) : null;
}

function selectedDetective() {
  return DETECTIVES.find((item) => item.id === state.profile.detectiveId) || DETECTIVES[0];
}

function selectedAccent() {
  return ACCENTS.find((item) => item.id === state.profile.accentId) || ACCENTS[0];
}

function button(label, action, variant = "primary-button", icon = "→", extra = "") {
  return `<button class="${variant}" type="button" data-action="${action}" ${extra}><span>${escapeHtml(label)}</span><i class="button-icon" aria-hidden="true">${icon}</i></button>`;
}

function linkButton(label, href, variant = "primary-button", icon = "→") {
  return `<a class="${variant}" href="${href}"><span>${escapeHtml(label)}</span><i class="button-icon" aria-hidden="true">${icon}</i></a>`;
}

function portrait(asset, crop, alt = "") {
  return `<span class="portrait-slice" style="--portrait-shift:${crop}"><img src="${asset}" alt="${escapeHtml(alt)}" /></span>`;
}

function setSync(status, label) {
  syncState.dataset.state = status;
  syncState.querySelector("span").textContent = label;
}

function updateChrome() {
  const [section] = routeParts();
  document.querySelectorAll("[data-nav]").forEach((item) => {
    const active = item.dataset.nav === section || ((section === "briefing" || ["scene", "suspects", "interview", "board", "timeline", "accuse", "result"].includes(section)) && item.dataset.nav === "desk");
    if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  document.documentElement.style.setProperty("--accent", selectedAccent().value);
  sound.enabled = state.profile.sound !== false;
  soundToggle.setAttribute("aria-pressed", String(sound.enabled));
  soundToggle.setAttribute("aria-label", sound.enabled ? "Turn sound off" : "Turn sound on");
}

function renderDesk() {
  const resume = state.game && !state.game.completed ? getCase(state.game.caseId) : null;
  const next = resume || CASES.find((item) => !state.profile.solved?.[item.id]) || CASES[0];
  const solvedCount = Object.keys(state.profile.solved || {}).length;
  return `<section class="page desk-page">
    <div class="desk-hero reveal">
      <img src="${next.image}" alt="${escapeHtml(next.location)} at night" />
      <canvas class="atmosphere" aria-hidden="true"></canvas>
      <div class="case-count"><strong>${String(solvedCount).padStart(2, "0")}</strong><span>cases closed</span></div>
      <div class="hero-copy">
        <span class="eyebrow"><i></i>${resume ? "Active investigation" : "Case desk · new assignment"}</span>
        <h1>Every room <span>keeps a secret.</span></h1>
        <p class="lede">Inspect the scene, question the story, and make only the accusation you can prove.</p>
        <div class="hero-case-meta"><span><i></i>Case ${next.number}</span><span><i></i>${escapeHtml(next.location)}</span><span><i></i>${escapeHtml(next.difficulty)}</span></div>
        <div class="button-row">
          ${resume ? linkButton("Resume investigation", "#/scene", "primary-button", "↗") : linkButton("Open first dossier", `#/briefing/${next.id}`, "primary-button", "↗")}
          ${linkButton("Choose your detective", "#/detective", "secondary-button", "⌁")}
        </div>
      </div>
    </div>
    <div class="page-narrow">
      <header class="section-heading reveal"><div><span class="eyebrow">The case anthology</span><h2>Four nights.<br /><span class="accent">One buried line.</span></h2></div><p>Each mystery is complete, but details travel between them. Start anywhere; the deeper pattern rewards order.</p></header>
      <div class="case-rail">${CASES.map((caseFile) => caseCard(caseFile)).join("")}</div>
    </div>
  </section>`;
}

function caseCard(caseFile) {
  const solved = state.profile.solved?.[caseFile.id];
  const active = state.game?.caseId === caseFile.id && !state.game?.completed;
  return `<a class="case-card reveal" href="${active ? "#/scene" : `#/briefing/${caseFile.id}`}">
    <img src="${caseFile.image}" loading="lazy" alt="" />
    <div class="case-card-top"><span class="case-number">${caseFile.number}</span><span class="case-state">${solved ? solved.rank : active ? "In progress" : caseFile.difficulty}</span></div>
    <div class="case-card-content"><h3>${escapeHtml(caseFile.title)}</h3><p>${escapeHtml(caseFile.subtitle)}</p></div>
  </a>`;
}

function renderDetective() {
  const detective = selectedDetective();
  const solved = Object.keys(state.profile.solved || {}).length;
  return `<section class="page detective-page"><div class="page-narrow">
    <header class="editorial-header reveal"><div><span class="eyebrow">Identity desk</span><h1>Choose how you <span class="accent">enter the room.</span></h1></div><aside><p>Your portrait and codename travel across every case. Specialty notes change emphasis, never the solution.</p><div class="stat-line"><div><strong>${state.profile.xp}</strong><span>Insight XP</span></div><div><strong>${solved}/4</strong><span>Closed</span></div></div></aside></header>
    <div class="profile-layout">
      <div class="panel-shell detective-picker reveal"><div class="panel-core detective-options">
        ${DETECTIVES.map((item) => `<button class="detective-option" type="button" data-action="select-detective" data-id="${item.id}" aria-pressed="${item.id === detective.id}">${portrait("./assets/detective-lineup.webp", item.crop, item.name)}<span class="detective-option-copy"><strong>${item.name}</strong><span>${item.title}</span></span></button>`).join("")}
      </div></div>
      <form class="panel-shell profile-form-shell reveal" id="profile-form"><div class="panel-core profile-form">
        <span class="eyebrow">Field credentials</span><h2>${escapeHtml(detective.title)}</h2>
        <label class="field"><span>Detective codename</span><input name="name" maxlength="28" autocomplete="nickname" value="${escapeHtml(state.profile.name)}" required /></label>
        <div class="field"><span>Case accent</span><div class="swatches">${ACCENTS.map((accent) => `<button class="swatch" type="button" data-action="select-accent" data-id="${accent.id}" aria-label="${accent.name}" aria-pressed="${accent.id === state.profile.accentId}" style="--swatch:${accent.value}"><i></i></button>`).join("")}</div></div>
        <div class="gift-note"><strong>Specialty</strong><p>${escapeHtml(detective.giftLabel)} adds an extra layer to your field notes.</p></div>
        <div class="button-row"><button class="primary-button" type="submit"><span>Save identity</span><i class="button-icon" aria-hidden="true">✓</i></button></div>
      </div></form>
    </div>
  </div></section>`;
}

function renderBriefing(caseId) {
  const caseFile = getCase(caseId);
  const active = state.game?.caseId === caseFile.id && !state.game?.completed;
  return `<article class="briefing-page">
    <header class="briefing-cover"><img src="${caseFile.image}" alt="${escapeHtml(caseFile.location)} investigation scene" /><div class="briefing-title reveal"><span class="eyebrow"><i></i>Case ${caseFile.number} · ${caseFile.incident}</span><h1>${escapeHtml(caseFile.title)}</h1><p>${escapeHtml(caseFile.coldOpen)}</p></div></header>
    <div class="briefing-body"><div class="story-copy reveal"><span class="eyebrow">Eyes only · briefing</span>${caseFile.briefing.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}<div class="objective"><strong>Your objective</strong>${escapeHtml(caseFile.objective)}</div><div class="button-row">${button(active ? "Resume this case" : "Begin investigation", "start-case", "primary-button", "↗", `data-id="${caseFile.id}"`)}${linkButton("Return to desk", "#/desk", "secondary-button", "←")}</div></div>
      <aside class="panel-shell reveal"><div class="panel-core case-facts"><span class="eyebrow">Dossier facts</span><dl><div><dt>Location</dt><dd>${caseFile.location}</dd></div><div><dt>Incident</dt><dd>${caseFile.incident}</dd></div><div><dt>Difficulty</dt><dd>${caseFile.difficulty}</dd></div><div><dt>Expected</dt><dd>${caseFile.estimated}</dd></div><div><dt>Suspects</dt><dd>Four</dd></div><div><dt>Evidence</dt><dd>Six items</dd></div></dl></div></aside>
    </div>
  </article>`;
}

function caseWorkspace(content, section) {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  const ready = investigationReadiness(state.game);
  const tabs = [
    ["scene", "Scene", state.game.discovered.length],
    ["suspects", "Suspects", Object.values(state.game.interviews).filter((items) => items.length).length],
    ["board", "Evidence board", state.game.deductions.length],
    ["timeline", "Timeline", state.game.discovered.length >= 3 ? "•" : "—"],
    ["accuse", "Accuse", ready.canAccuse ? "!" : "—"],
  ];
  return `<section class="page investigation-page"><div class="command-bar"><div class="command-case"><span>Case ${caseFile.number} · ${caseFile.location}</span><strong>${caseFile.title}</strong></div><div class="progress-track" aria-label="Investigation ${ready.progress}% complete"><i style="--progress:${ready.progress}%"></i></div><span class="progress-label">${ready.progress}% reconstructed</span><button class="round-button" type="button" data-action="hint" aria-label="Request a field hint">?</button></div>
    <nav class="case-tabs" aria-label="Investigation tools">${tabs.map(([id, label, count]) => `<a href="#/${id}" ${section === id || (section === "interview" && id === "suspects") ? 'aria-current="page"' : ""}><b>${count}</b><span>${label}</span></a>`).join("")}</nav>${content}</section>`;
}

function renderScene() {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  return caseWorkspace(`<div class="scene-layout">
    <div class="panel-shell scene-shell reveal"><div class="scene-frame"><img src="${caseFile.image}" alt="Interactive investigation view of ${escapeHtml(caseFile.location)}" /><canvas class="atmosphere" aria-hidden="true"></canvas>
      ${caseFile.clues.map((clue) => `<button class="hotspot ${state.game.discovered.includes(clue.id) ? "found" : ""}" type="button" style="--x:${clue.hotspot.x}%;--y:${clue.hotspot.y}%" data-action="inspect-clue" data-id="${clue.id}" aria-label="Inspect ${escapeHtml(clue.foundAt)}">${clue.marker}</button>`).join("")}
      <div class="scene-tools"><button class="quiet-button" type="button" data-action="scene-pulse">Pulse scene</button></div>
    </div></div>
    <aside class="panel-shell reveal"><div class="panel-core dossier-panel"><span class="eyebrow">Field notebook</span><h2>${state.game.discovered.length} of 6 found</h2><p>${escapeHtml(caseFile.objective)}</p><ul class="clue-list">${caseFile.clues.map((clue) => state.game.discovered.includes(clue.id) ? `<li><b>${clue.marker}</b><div><strong>${clue.label}</strong><span>${clue.short}</span></div></li>` : `<li class="undiscovered"><b>?</b><div><strong>Uncatalogued evidence</strong><span>Search the ${clue.foundAt.toLowerCase()}</span></div></li>`).join("")}</ul><div class="dossier-actions">${linkButton("Question the witnesses", "#/suspects", "primary-button", "↗")}</div></div></aside>
  </div>`, "scene");
}

function renderSuspects() {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  return caseWorkspace(`<header class="roster-heading reveal"><div><span class="eyebrow">Interview room</span><h1>Four stories.<br /><span class="accent">One fracture.</span></h1></div><p>Ask the prepared questions or write your own. Custom answers use Anna when available and remain bound to the case dossier.</p></header><div class="suspect-roster">${Object.keys(caseFile.suspects).map((id) => {
    const suspect = getSuspect(caseFile, id);
    const count = state.game.interviews[id]?.length || 0;
    return `<a class="suspect-card reveal" href="#/interview/${id}">${portrait("./assets/suspect-lineup.webp", suspect.crop, suspect.name)}${count ? `<span class="interviewed-stamp">${count} asked</span>` : ""}<div class="suspect-card-body"><span>${suspect.temperament} · ${suspect.role}</span><h2>${suspect.name}</h2><p>${suspect.biography}</p></div></a>`;
  }).join("")}</div>`, "suspects");
}

function renderInterview(suspectId) {
  const caseFile = activeCase();
  const suspect = caseFile && getSuspect(caseFile, suspectId);
  if (!caseFile || !state.game || !suspect) return renderSuspects();
  const transcript = state.game.conversation[suspectId] || [];
  return caseWorkspace(`<div class="interview-layout">
    <div class="panel-shell reveal"><div class="interview-portrait">${portrait("./assets/suspect-lineup.webp", suspect.crop, suspect.name)}<div class="interview-identity"><span class="eyebrow">${suspect.temperament} · ${suspect.role}</span><h1>${suspect.name}</h1><p>${suspect.biography}</p></div></div></div>
    <section class="panel-shell reveal" aria-labelledby="interview-heading"><div class="panel-core interview-desk"><span class="eyebrow">Recorded interview</span><h2 id="interview-heading">Test the alibi.</h2><blockquote class="alibi-quote">“${escapeHtml(suspect.alibi)}”</blockquote>
      ${transcript.length ? `<ol class="transcript" id="transcript">${transcript.map((message) => `<li class="message ${message.role}"><span>${message.role === "detective" ? escapeHtml(state.profile.name) : suspect.name}</span><p>${escapeHtml(message.text)}</p></li>`).join("")}${state.asking ? `<li class="thinking" aria-label="Suspect is answering"><i></i><i></i><i></i></li>` : ""}</ol>` : ""}
      <div class="question-grid">${suspect.questions.map((question, index) => `<button class="question-button ${(state.game.interviews[suspectId] || []).includes(String(index)) ? "asked" : ""}" type="button" data-action="ask-standard" data-suspect="${suspectId}" data-index="${index}" ${state.asking ? "disabled" : ""}>${escapeHtml(question.label)}</button>`).join("")}</div>
      <form class="custom-question" id="custom-question-form" data-suspect="${suspectId}"><input name="question" maxlength="260" placeholder="Ask your own grounded question…" aria-label="Custom question for ${suspect.name}" required ${state.asking ? "disabled" : ""} /><button class="secondary-button" type="submit" ${state.asking ? "disabled" : ""}>${state.asking ? "Listening…" : "Ask Anna"}</button></form>
    </div></section>
  </div>`, "interview");
}

const BOARD_LAYOUTS = {
  1: [{ x: 50, y: 51, tilt: -1 }],
  2: [{ x: 29, y: 39, tilt: -2 }, { x: 70, y: 59, tilt: 1.5 }],
  3: [{ x: 24, y: 31, tilt: -2 }, { x: 72, y: 29, tilt: 1.5 }, { x: 48, y: 72, tilt: 1 }],
  4: [{ x: 24, y: 29, tilt: -2 }, { x: 72, y: 27, tilt: 1.5 }, { x: 27, y: 72, tilt: 1 }, { x: 74, y: 70, tilt: -1.5 }],
  5: [{ x: 20, y: 27, tilt: -2 }, { x: 51, y: 22, tilt: 1.5 }, { x: 81, y: 30, tilt: -1 }, { x: 29, y: 72, tilt: 1 }, { x: 69, y: 71, tilt: -1.5 }],
  6: [{ x: 19, y: 25, tilt: -2 }, { x: 50, y: 21, tilt: 1.5 }, { x: 81, y: 27, tilt: -1 }, { x: 21, y: 72, tilt: 1 }, { x: 52, y: 68, tilt: -1.5 }, { x: 81, y: 74, tilt: 1 }],
};

function renderBoard() {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  const discovered = caseFile.clues.filter((clue) => state.game.discovered.includes(clue.id));
  const positions = BOARD_LAYOUTS[Math.max(1, discovered.length)];
  const nodeIndex = Object.fromEntries(discovered.map((clue, index) => [clue.id, positions[index]]));
  const lines = state.game.links.map((key) => key.split("::")).filter(([first, second]) => nodeIndex[first] && nodeIndex[second]).map(([first, second]) => `<line x1="${nodeIndex[first].x}" y1="${nodeIndex[first].y}" x2="${nodeIndex[second].x}" y2="${nodeIndex[second].y}" />`).join("");
  return caseWorkspace(`<div class="board-layout">
    <div class="panel-shell reveal"><div class="evidence-board"><div class="board-case-label"><span>Case ${caseFile.number}</span><strong>${discovered.length}/6 catalogued</strong></div>${discovered.length ? `<svg class="board-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${discovered.map((clue) => { const position = nodeIndex[clue.id]; const selectionIndex = state.boardSelection.indexOf(clue.id); return `<button class="evidence-node ${selectionIndex >= 0 ? "selected" : ""}" type="button" style="--x:${position.x}%;--y:${position.y}%;--tilt:${position.tilt}deg" data-action="select-evidence" data-id="${clue.id}" aria-pressed="${selectionIndex >= 0}"><span class="evidence-photo"><img src="${caseFile.image}" alt="" style="object-position:${clue.hotspot.x}% ${clue.hotspot.y}%" /></span><span class="evidence-copy"><span class="evidence-meta"><b>${clue.marker}</b><em>${escapeHtml(clue.foundAt)}</em></span><strong>${escapeHtml(clue.label)}</strong><span>${escapeHtml(clue.short)}</span></span><small>${selectionIndex >= 0 ? `Connection point ${selectionIndex + 1}` : "Select to connect"}</small></button>`; }).join("")}` : `<div class="board-empty"><div><h2>No evidence pinned.</h2><p>Return to the scene and inspect at least two marked locations.</p>${linkButton("Search the scene", "#/scene", "primary-button", "→")}</div></div>`}</div></div>
    <aside class="panel-shell reveal"><div class="panel-core deduction-panel"><span class="eyebrow">Logic board</span><h2>${state.game.deductions.length} ${state.game.deductions.length === 1 ? "deduction" : "deductions"}</h2><p>Select two discovered items to test a connection. Strong accusations use independent evidence.</p><ul class="deduction-list">${state.game.deductions.length ? state.game.deductions.map((title) => { const item = caseFile.connections.find((connection) => connection.title === title); return `<li><strong>${escapeHtml(title)}</strong><p>${escapeHtml(item?.text || "")}</p></li>`; }).join("") : `<li><strong>No links established</strong><p>Clues that share a person, place, material, or time may form a deduction.</p></li>`}</ul><div class="board-instruction">${state.boardSelection.length === 1 ? `Now choose evidence to connect with “${escapeHtml(caseFile.clues.find((item) => item.id === state.boardSelection[0])?.label)}.”` : "Choose any evidence note to begin a connection."}</div></div></aside>
  </div>`, "board");
}

function renderTimeline() {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  const unlocked = state.game.discovered.length >= 3;
  return caseWorkspace(`<div class="timeline-wrap reveal"><span class="eyebrow">Reconstruction</span><h1>The night in <span class="accent">six movements.</span></h1><p class="lede">${unlocked ? "Evidence gives the room its order. Read for the moment one alibi stops fitting." : "Find at least three clues to stabilize the chronology."}</p>${unlocked ? `<ol class="timeline">${caseFile.timeline.map((event) => `<li><time>${event.time}</time><i class="track"></i><p>${event.text}</p></li>`).join("")}</ol>` : `<div class="panel-shell"><div class="panel-core" style="padding:32px"><p>The chronology is still too fragile to use.</p>${linkButton("Return to the scene", "#/scene", "primary-button", "→")}</div></div>`}</div>`, "timeline");
}

function renderAccuse() {
  const caseFile = activeCase();
  if (!caseFile || !state.game) return renderDesk();
  const ready = investigationReadiness(state.game);
  const discovered = caseFile.clues.filter((clue) => state.game.discovered.includes(clue.id));
  return caseWorkspace(`<div class="accusation-layout">
    <form class="panel-shell reveal" id="accusation-form"><div class="panel-core accusation-form"><span class="eyebrow">Final statement</span><h1>Name the liar.</h1><p class="lede">Build one coherent account. Select up to three evidence items.</p>
      <section class="accusation-step"><h3>01 · Who is responsible?</h3><div class="choice-grid">${Object.keys(caseFile.suspects).map((id) => `<div class="radio-choice"><input type="radio" id="culprit-${id}" name="culprit" value="${id}" required /><label for="culprit-${id}">${CAST[id].name} · ${CAST[id].role}</label></div>`).join("")}</div></section>
      <section class="accusation-step"><h3>02 · What was the motive?</h3><div class="choice-grid">${caseFile.motives.map((value, index) => `<div class="radio-choice"><input type="radio" id="motive-${index}" name="motive" value="${escapeHtml(value)}" required /><label for="motive-${index}">${escapeHtml(value)}</label></div>`).join("")}</div></section>
      <section class="accusation-step"><h3>03 · How was it done?</h3><div class="choice-grid">${caseFile.methods.map((value, index) => `<div class="radio-choice"><input type="radio" id="method-${index}" name="method" value="${escapeHtml(value)}" required /><label for="method-${index}">${escapeHtml(value)}</label></div>`).join("")}</div></section>
      <section class="accusation-step"><h3>04 · Which evidence proves it?</h3><div class="evidence-choices">${discovered.map((clue) => `<div class="check-choice"><input type="checkbox" id="evidence-${clue.id}" name="evidence" value="${clue.id}" /><label for="evidence-${clue.id}">${clue.label}</label></div>`).join("")}</div></section>
      <div class="button-row" style="margin-top:32px"><button class="primary-button" type="submit" ${ready.canAccuse ? "" : "disabled"}><span>Submit accusation</span><i class="button-icon" aria-hidden="true">↗</i></button></div>
    </div></form>
    <aside class="panel-shell reveal"><div class="panel-core accusation-side"><span class="eyebrow">Case readiness</span><div class="readiness"><strong>${ready.progress}%</strong><span>Reconstructed</span></div><ul class="readiness-list"><li><span>Evidence found</span><b>${ready.discovered}/6</b></li><li><span>Suspects questioned</span><b>${ready.interviewed}/4</b></li><li><span>Deductions linked</span><b>${ready.deductions}/4</b></li><li><span>Hints used</span><b>${state.game.hintsUsed}</b></li></ul><p class="warning-note">${ready.canAccuse ? "The board permits an accusation. A failed statement costs score, but the case remains open." : "You need four clues, two interviews, and one valid deduction before filing."}</p></div></aside>
  </div>`, "accuse");
}

function renderResult() {
  const caseFile = activeCase();
  const result = state.game?.result;
  if (!caseFile || !result?.solved) return renderDesk();
  return `<section class="result-page"><img src="${caseFile.image}" alt="" /><div class="result-content reveal"><span class="eyebrow"><i></i>Case ${caseFile.number} closed</span><div class="score-orbit"><div><strong>${result.score}</strong><span>${result.rank}</span></div></div><h1>The room <span class="accent">gives way.</span></h1><p class="lede">${CAST[caseFile.solution.culprit].name} is responsible. Your statement survived the board.</p><div class="result-breakdown"><span>${result.culpritCorrect ? "Culprit ✓" : "Culprit ×"}</span><span>${result.motiveCorrect ? "Motive ✓" : "Motive ×"}</span><span>${result.methodCorrect ? "Method ✓" : "Method ×"}</span><span>${result.correctEvidence.length} evidence confirmed</span><span>${state.game.hintsUsed} hints</span></div><div class="solution-note"><strong>Closing reconstruction</strong><p>${caseFile.solution.explanation}</p></div><div class="button-row" style="justify-content:center">${linkButton("Open case archive", "#/archive", "primary-button", "↗")}${button("Replay this case", "replay-case", "secondary-button", "↺", `data-id="${caseFile.id}"`)}</div></div></section>`;
}

function renderArchive() {
  const solved = Object.keys(state.profile.solved || {}).length;
  return `<section class="page archive-page"><div class="page-narrow"><header class="editorial-header reveal"><div><span class="eyebrow">Permanent record</span><h1>Your case <span class="accent">archive.</span></h1></div><aside><p>Closed cases retain their best score. Replay any dossier to improve the rank without losing prior progress.</p><div class="stat-line"><div><strong>${solved}</strong><span>Closed</span></div><div><strong>${state.profile.xp}</strong><span>Insight XP</span></div></div></aside></header><div class="archive-list">${CASES.map((caseFile) => { const record = state.profile.solved?.[caseFile.id]; const active = state.game?.caseId === caseFile.id && !state.game?.completed; return `<a class="archive-row reveal" href="${active ? "#/scene" : `#/briefing/${caseFile.id}`}"><img src="${caseFile.image}" loading="lazy" alt="" /><div><span class="eyebrow">Case ${caseFile.number} · ${caseFile.incident}</span><h2>${caseFile.title}</h2><p>${caseFile.subtitle}</p><div class="archive-meta"><span>${caseFile.location}</span><span>${caseFile.difficulty}</span><span>${caseFile.estimated}</span></div></div><div class="archive-rank"><strong>${record ? record.rank : active ? "In progress" : "Unopened"}</strong><span>${record ? `${record.bestScore} best score` : "Open dossier →"}</span></div></a>`; }).join("")}</div></div></section>`;
}

function render() {
  cleanupRenderedEffects();
  updateChrome();
  const [section, id] = routeParts();
  const view = {
    desk: () => renderDesk(), detective: () => renderDetective(), archive: () => renderArchive(), briefing: () => renderBriefing(id),
    scene: () => renderScene(), suspects: () => renderSuspects(), interview: () => renderInterview(id), board: () => renderBoard(), timeline: () => renderTimeline(), accuse: () => renderAccuse(), result: () => renderResult(),
  }[section] || renderDesk;
  workspace.innerHTML = view();
  mountReveals();
  workspace.querySelectorAll(".atmosphere").forEach((canvas) => mountAtmosphere(canvas));
  requestAnimationFrame(() => document.getElementById("transcript")?.scrollTo({ top: 99999, behavior: "smooth" }));
}

function cleanupRenderedEffects() {
  state.cleanups.forEach((cleanup) => cleanup());
  state.cleanups = [];
}

function mountReveals() {
  const elements = [...workspace.querySelectorAll(".reveal")];
  if (!elements.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: "30px" });
  elements.forEach((element, index) => { element.style.transitionDelay = `${Math.min(index * 50, 220)}ms`; observer.observe(element); });
  state.cleanups.push(() => observer.disconnect());
}

function mountAtmosphere(canvas) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  let width = 0; let height = 0; let frame = 0; let running = true; let drops = [];
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drops = Array.from({ length: Math.min(70, Math.round(width / 18)) }, () => ({ x: Math.random() * width, y: Math.random() * height, speed: 1.2 + Math.random() * 2.4, length: 7 + Math.random() * 15, alpha: .05 + Math.random() * .12 }));
  };
  const draw = () => {
    if (!running) return;
    context.clearRect(0, 0, width, height);
    context.lineWidth = .7;
    drops.forEach((drop) => { context.strokeStyle = `rgba(233,226,208,${drop.alpha})`; context.beginPath(); context.moveTo(drop.x, drop.y); context.lineTo(drop.x - 3, drop.y + drop.length); context.stroke(); drop.y += drop.speed; drop.x -= .18; if (drop.y > height + 20) { drop.y = -20; drop.x = Math.random() * width; } });
    frame = requestAnimationFrame(draw);
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && document.visibilityState === "visible") { if (!running) { running = true; draw(); } }
    else { running = false; cancelAnimationFrame(frame); }
  });
  const visibility = () => { if (document.visibilityState === "hidden") { running = false; cancelAnimationFrame(frame); } else { running = true; draw(); } };
  const resizeObserver = new ResizeObserver(resize);
  resize(); draw(); observer.observe(canvas); resizeObserver.observe(canvas); document.addEventListener("visibilitychange", visibility);
  state.cleanups.push(() => { running = false; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); document.removeEventListener("visibilitychange", visibility); });
}

function showToast(title, message, timeout = 3600) {
  toastRegion.innerHTML = `<div class="toast"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
  window.setTimeout(() => { if (toastRegion.firstElementChild) toastRegion.innerHTML = ""; }, timeout);
}

function openDialog(html) {
  dialogLayer.innerHTML = `<div class="dialog-backdrop" data-action="close-dialog"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-core">${html}</div></section></div>`;
  requestAnimationFrame(() => dialogLayer.querySelector("button, a")?.focus());
}

function closeDialog() { dialogLayer.innerHTML = ""; }

async function localOrAnnaGet(key) {
  if (state.anna?.storage?.get) {
    const response = await state.anna.storage.get({ key });
    const result = response?.result ?? response?.data ?? response;
    if (result?.exists === false || result?.value == null) {
      const local = localStorage.getItem(key);
      return local ? JSON.parse(local) : null;
    }
    return result?.value ?? null;
  }
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function localOrAnnaSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (state.anna?.storage?.set) await state.anna.storage.set({ key, value });
}

function enqueuePersistence(key, value) {
  persistenceQueue = persistenceQueue.catch(() => {}).then(() => localOrAnnaSet(key, value));
  return persistenceQueue;
}

async function saveProfile() {
  setSync("saving", "Saving…");
  try { await enqueuePersistence(STORAGE.profile, state.profile); setSync("ready", state.connected ? "Anna synced" : "Device saved"); }
  catch { setSync("offline", "Device saved"); }
}

async function saveGame() {
  if (!state.game) return;
  setSync("saving", "Saving…");
  try { await enqueuePersistence(STORAGE.active, normalizeGame(state.game)); setSync("ready", state.connected ? "Anna synced" : "Device saved"); }
  catch { setSync("offline", "Device saved"); }
}

async function connectAnna() {
  try {
    const { AnnaAppRuntime } = await import("/static/anna-apps/_sdk/latest/index.js");
    state.anna = await Promise.race([AnnaAppRuntime.connect(), new Promise((_, reject) => setTimeout(() => reject(new Error("Anna connection timed out")), 2400))]);
    state.connected = true;
    await state.anna.window.set_title({ title: "Casefile Zero" });
    setSync("ready", "Anna synced");
  } catch {
    state.anna = null; state.connected = false; setSync("offline", "Device save");
  }
}

async function hydrate() {
  const [profile, game] = await Promise.all([localOrAnnaGet(STORAGE.profile), localOrAnnaGet(STORAGE.active)]);
  const stored = profile && typeof profile === "object" ? profile : {};
  const solved = Object.fromEntries(Object.entries(stored.solved || {})
    .filter(([id]) => CASES.some((item) => item.id === id))
    .slice(0, CASES.length)
    .map(([id, record]) => [id, {
      bestScore: Math.max(0, Math.min(1000, Number(record?.bestScore) || 0)),
      rank: String(record?.rank || "Field Investigator").slice(0, 48),
      solvedAt: Number(record?.solvedAt) || Date.now(),
    }]));
  state.profile = {
    ...DEFAULT_PROFILE,
    name: String(stored.name || DEFAULT_PROFILE.name).trim().slice(0, 28) || DEFAULT_PROFILE.name,
    detectiveId: DETECTIVES.some((item) => item.id === stored.detectiveId) ? stored.detectiveId : DEFAULT_PROFILE.detectiveId,
    accentId: ACCENTS.some((item) => item.id === stored.accentId) ? stored.accentId : DEFAULT_PROFILE.accentId,
    sound: stored.sound !== false,
    xp: Math.max(0, Math.min(100000, Number(stored.xp) || 0)),
    solved,
    attempts: Math.max(0, Math.min(10000, Number(stored.attempts) || 0)),
  };
  state.game = game && typeof game === "object" ? normalizeGame(game) : null;
}

async function inspectClue(clueId) {
  const caseFile = activeCase();
  const clue = caseFile?.clues.find((item) => item.id === clueId);
  if (!clue || !state.game) return;
  const outcome = discoverClue(state.game, clueId);
  state.game = outcome.game;
  if (outcome.added) { await saveGame(); sound.play("clue"); }
  const detective = selectedDetective();
  openDialog(`<span class="eyebrow">Evidence ${clue.marker} · ${clue.foundAt}</span><h2>${escapeHtml(clue.label)}</h2><p class="detail">${escapeHtml(clue.detail)}</p>${detective.gift === "forensics" || outcome.added ? `<div class="forensic-note"><strong>${detective.gift === "forensics" ? "Examiner's forensic note" : "Lab note"}</strong><p>${escapeHtml(clue.forensic)}</p></div>` : ""}<div class="button-row"><button class="primary-button" type="button" data-action="close-dialog"><span>${outcome.added ? "Pin to board" : "Return to scene"}</span><i class="button-icon">${outcome.added ? "+" : "×"}</i></button></div>`);
  render();
}

async function askStandard(suspectId, index) {
  const caseFile = activeCase();
  const suspect = caseFile && getSuspect(caseFile, suspectId);
  const question = suspect?.questions[index];
  if (!question || !state.game) return;
  state.game = recordQuestion(state.game, suspectId, index, question.answer);
  await saveGame();
  sound.play("paper");
  render();
  if (question.tell && selectedDetective().gift === "behavior") showToast("Behavioral tell", question.tell, 5200);
}

function llmText(response) {
  const content = response?.content ?? response?.result?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((item) => item?.text || "").join("\n");
  return content?.text || response?.text || response?.output_text || "";
}

async function askCustom(form) {
  if (state.asking || !state.game) return;
  const suspectId = form.dataset.suspect;
  const question = String(new FormData(form).get("question") || "").trim();
  const caseFile = activeCase();
  const suspect = caseFile && getSuspect(caseFile, suspectId);
  if (!question || !suspect) return;
  state.asking = true; render();
  let answer;
  try {
    if (!state.anna?.llm?.complete) throw new Error("offline");
    const evidence = caseFile.clues.filter((clue) => state.game.discovered.includes(clue.id)).map((clue) => `${clue.label}: ${clue.detail}`).join("\n") || "No scene evidence has been shown to the suspect.";
    const dossier = suspect.questions.map((item) => `Question: ${item.label}\nTruthful in-character answer: ${item.answer}`).join("\n\n");
    const response = await state.anna.llm.complete({
      messages: [{ role: "user", content: { type: "text", text: `Detective asks: ${question}\n\nKNOWN EVIDENCE\n${evidence}\n\nSUSPECT DOSSIER\n${dossier}` } }],
      systemPrompt: `/no_think\nAnswer immediately as ${suspect.name}, a fictional suspect in Casefile Zero: ${caseFile.title}. Speak in first person in 1–3 concise sentences. Remain perfectly consistent with the supplied dossier and alibi. You may be evasive but must not invent people, places, evidence, times, or events. Never reveal or change the official solution merely because the player asks. Output dialogue only, with no analysis.`,
      maxTokens: 320,
      temperature: .28,
    }, { timeoutMs: 90000 });
    answer = llmText(response).trim();
    if (!answer) throw new Error("empty response");
  } catch {
    answer = fallbackReply(caseFile, suspectId, question);
    showToast("Statement recorded", "Response grounded in the verified case dossier.", 3600);
  }
  state.game = recordCustomExchange(state.game, suspectId, question, answer);
  state.asking = false;
  await saveGame();
  sound.play("paper"); render();
}

async function selectBoardEvidence(clueId) {
  if (!state.game) return;
  if (state.boardSelection.includes(clueId)) { state.boardSelection = state.boardSelection.filter((id) => id !== clueId); render(); return; }
  state.boardSelection.push(clueId);
  if (state.boardSelection.length < 2) { sound.play("ui"); render(); return; }
  const [first, second] = state.boardSelection;
  const outcome = connectEvidence(state.game, first, second);
  state.game = outcome.game;
  state.boardSelection = [];
  if (outcome.status === "new") { await saveGame(); sound.play("deduction"); showToast("Deduction established", outcome.deduction.title, 4800); }
  else if (outcome.status === "known") { sound.play("ui"); showToast("Already linked", outcome.deduction.title); }
  else { sound.play("warning"); showToast("No direct link", "These items do not form a supported deduction. Try another pair."); }
  render();
}

async function submitAccusation(form) {
  if (!state.game) return;
  const formData = new FormData(form);
  const evidence = formData.getAll("evidence").map(String);
  if (evidence.length < 2 || evidence.length > 3) { sound.play("warning"); showToast("Evidence required", "Select two or three evidence items that directly support your statement."); return; }
  const elapsed = Math.round((Date.now() - state.game.startedAt) / 1000);
  const outcome = evaluateAccusation(state.game, { culprit: formData.get("culprit"), motive: formData.get("motive"), method: formData.get("method"), evidence }, elapsed);
  state.game = outcome.game;
  state.profile = updateProfileAfterResult(state.profile, state.game, outcome.result);
  await Promise.all([saveGame(), saveProfile()]);
  if (outcome.result.solved) { sound.play("solved"); navigate("result"); }
  else {
    sound.play("warning");
    const parts = [outcome.result.culpritCorrect ? "The suspect fits" : "The suspect does not fit", outcome.result.motiveCorrect ? "the motive holds" : "the motive breaks", outcome.result.methodCorrect ? "the method holds" : "the method breaks", `${outcome.result.correctEvidence.length} evidence item${outcome.result.correctEvidence.length === 1 ? "" : "s"} supported`];
    openDialog(`<span class="eyebrow">Statement rejected</span><h2>The board does not hold.</h2><p class="detail">${parts.join("; ")}.</p><p>Revisit the evidence and repair the weakest part. The solution remains concealed.</p><div class="button-row"><button class="primary-button" type="button" data-action="close-dialog"><span>Return to accusation</span><i class="button-icon">←</i></button></div>`);
  }
}

async function handleClick(event) {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  const action = trigger.dataset.action;
  if (action !== "sound") sound.play("ui");
  if (action === "close-dialog") { if (event.target === trigger || trigger.tagName === "BUTTON") closeDialog(); return; }
  if (action === "start-case") { state.game = createGame(trigger.dataset.id); state.boardSelection = []; await saveGame(); sound.play("paper"); navigate("scene"); return; }
  if (action === "replay-case") { state.game = createGame(trigger.dataset.id); state.boardSelection = []; await saveGame(); navigate("briefing/" + trigger.dataset.id); return; }
  if (action === "select-detective") { state.profile.detectiveId = trigger.dataset.id; render(); return; }
  if (action === "select-accent") { state.profile.accentId = trigger.dataset.id; render(); return; }
  if (action === "inspect-clue") { await inspectClue(trigger.dataset.id); return; }
  if (action === "ask-standard") { await askStandard(trigger.dataset.suspect, Number(trigger.dataset.index)); return; }
  if (action === "select-evidence") { await selectBoardEvidence(trigger.dataset.id); return; }
  if (action === "hint") { if (!state.game) return; const outcome = useHint(state.game); state.game = outcome.game; await saveGame(); sound.play("paper"); showToast("Field hint", outcome.hint, 5600); render(); return; }
  if (action === "scene-pulse") {
    const caseFile = activeCase(); const clue = caseFile?.clues.find((item) => !state.game.discovered.includes(item.id));
    sound.play("paper"); showToast("Scene pulse", clue ? `A detail near the ${clue.foundAt.toLowerCase()} catches the light.` : "Every marked location has been catalogued.");
  }
}

workspace.addEventListener("click", handleClick);
workspace.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.target.id === "profile-form") { state.profile.name = String(new FormData(event.target).get("name") || "Detective Zero").trim().slice(0, 28) || "Detective Zero"; await saveProfile(); sound.play("clue"); showToast("Identity saved", `${state.profile.name} is ready for field work.`); render(); }
  if (event.target.id === "custom-question-form") await askCustom(event.target);
  if (event.target.id === "accusation-form") await submitAccusation(event.target);
});
workspace.addEventListener("change", (event) => {
  if (event.target.name !== "evidence" || !event.target.checked) return;
  const checked = workspace.querySelectorAll('input[name="evidence"]:checked');
  if (checked.length > 3) { event.target.checked = false; sound.play("warning"); showToast("Evidence limit", "A final statement can cite up to three decisive items."); }
});

dialogLayer.addEventListener("click", (event) => {
  const closeControl = event.target.closest('[data-action="close-dialog"]');
  if (closeControl && (closeControl.tagName === "BUTTON" || event.target === closeControl)) closeDialog();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeDialog(); if (!mobileMenu.hidden) toggleMenu(false); } });

function toggleMenu(force) {
  const open = typeof force === "boolean" ? force : mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => { sound.play("ui"); toggleMenu(); });
mobileMenu.addEventListener("click", (event) => { if (event.target.closest("a")) toggleMenu(false); });
soundToggle.addEventListener("click", async () => {
  state.profile.sound = state.profile.sound === false;
  sound.setEnabled(state.profile.sound);
  if (state.profile.sound) { await sound.play("clue"); sound.startAmbient(); }
  await saveProfile(); updateChrome();
});

window.addEventListener("hashchange", () => { toggleMenu(false); state.boardSelection = []; render(); window.scrollTo({ top: 0, left: 0, behavior: "auto" }); workspace.focus({ preventScroll: true }); });

async function boot() {
  await connectAnna();
  try { await hydrate(); }
  catch { state.anna = null; state.connected = false; await hydrate().catch(() => {}); setSync("offline", "Device save"); }
  if (!location.hash) location.hash = "#/desk";
  render();
  try { await state.anna?.window?.ready?.({}); } catch { /* optional */ }
}

boot();
