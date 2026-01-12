/* Oasis Contabilidad — Profesional (GitHub Pages, localStorage) */
const HUB_URL = "https://eliezelapolinaris2017-lab.github.io/oasis-hub/";
const KEY = "oasis_accounting_pro_v1";

const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
const isoToday = () => new Date().toISOString().slice(0, 10);

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));

/* ========== DOM ========== */
const tabs = $("tabs");
const views = {
  dash: $("view-dash"),
  coa: $("view-coa"),
  journal: $("view-journal"),
  reports: $("view-reports"),
  data: $("view-data"),
};

const kpiEntries = $("kpiEntries");
const kpiIncome = $("kpiIncome");
const kpiExpense = $("kpiExpense");
const dashStatus = $("dashStatus");

const pFrom = $("pFrom");
const pTo = $("pTo");
const rFrom = $("rFrom");
const rTo = $("rTo");
const dashCards = $("dashCards");

/* COA */
const aCode = $("aCode");
const aName = $("aName");
const aType = $("aType");
const btnAddAccount = $("btnAddAccount");
const btnSeed = $("btnSeed");
const btnClearCOA = $("btnClearCOA");
const coaSearch = $("coaSearch");
const coaBody = $("coaBody");

/* Journal form */
const btnNewEntry = $("btnNewEntry");
const btnPostEntry = $("btnPostEntry");
const btnAddLine = $("btnAddLine");
const btnDeleteEntry = $("btnDeleteEntry");

const entryMode = $("entryMode");
const eDate = $("eDate");
const eRef = $("eRef");
const eMemo = $("eMemo");
const linesWrap = $("lines");

const tDebit = $("tDebit");
const tCredit = $("tCredit");
const tDiff = $("tDiff");

/* Journal list */
const jSearch = $("jSearch");
const jBody = $("jBody");

/* Reports */
const btnRunReports = $("btnRunReports");
const trialBody = $("trialBody");

const plNet = $("plNet");
const plIncome = $("plIncome");
const plExpense = $("plExpense");
const plHint = $("plHint");

const bsAssets = $("bsAssets");
const bsLiab = $("bsLiab");
const bsEquity = $("bsEquity");
const bsHint = $("bsHint");

/* Data */
const btnExport = $("btnExport");
const btnImport = $("btnImport");
const importFile = $("importFile");
const btnReset = $("btnReset");

/* ========== STATE ========== */
let activeEntryId = null;

/* ========== STORAGE ========== */
function loadDB() {
  return JSON.parse(localStorage.getItem(KEY) || JSON.stringify({
    coa: [],
    journal: []
  }));
}
function saveDB(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

/* ========== UI ========== */
function setView(name) {
  Object.keys(views).forEach(k => views[k].classList.toggle("is-active", k === name));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view === name));
}

/* ========== COA ========== */
const TYPE_LABEL = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Patrimonio",
  INCOME: "Ingresos",
  EXPENSE: "Gastos",
};

function sortCOA(coa) {
  return [...coa].sort((a, b) => String(a.code).localeCompare(String(b.code)));
}

function getAccountMap(coa) {
  const map = new Map();
  coa.forEach(a => map.set(a.code, a));
  return map;
}

function seedCOA() {
  const base = [
    { code: "1100", name: "Caja / Banco", type: "ASSET" },
    { code: "1200", name: "Cuentas por Cobrar", type: "ASSET" },
    { code: "1300", name: "Inventario", type: "ASSET" },
    { code: "1400", name: "Equipo / Herramientas", type: "ASSET" },

    { code: "2100", name: "Cuentas por Pagar", type: "LIABILITY" },
    { code: "2200", name: "Impuestos por Pagar", type: "LIABILITY" },

    { code: "3100", name: "Capital", type: "EQUITY" },
    { code: "3200", name: "Utilidad/Perdida del Periodo", type: "EQUITY" },

    { code: "4100", name: "Ventas / Servicios", type: "INCOME" },

    { code: "5100", name: "Materiales / Repuestos", type: "EXPENSE" },
    { code: "5200", name: "Combustible / Transporte", type: "EXPENSE" },
    { code: "5300", name: "Herramientas / Mantenimiento", type: "EXPENSE" },
    { code: "5400", name: "Teléfono / Internet", type: "EXPENSE" },
    { code: "5600", name: "Publicidad / Marketing", type: "EXPENSE" },
  ];

  const db = loadDB();
  const existing = new Set((db.coa || []).map(a => a.code));
  base.forEach(a => {
    if (!existing.has(a.code)) db.coa.push({ ...a, createdAt: new Date().toISOString() });
  });

  saveDB(db);
  renderCOA();
  refreshAll();
}

function addAccount() {
  const code = (aCode.value || "").trim();
  const name = (aName.value || "").trim();
  const type = aType.value;

  if (!code || !name) return alert("Código y nombre son obligatorios.");

  const db = loadDB();
  if ((db.coa || []).some(a => a.code === code)) return alert("Ese código ya existe.");

  db.coa.push({ code, name, type, createdAt: new Date().toISOString() });
  saveDB(db);

  aCode.value = "";
  aName.value = "";
  renderCOA();
  refreshAll();
}

function renderCOA() {
  const db = loadDB();
  const q = (coaSearch.value || "").trim().toLowerCase();

  const rows = sortCOA(db.coa || []).filter(a => {
    if (!q) return true;
    const hay = [a.code, a.name, TYPE_LABEL[a.type] || a.type].join(" ").toLowerCase();
    return hay.includes(q);
  });

  coaBody.innerHTML = "";
  if (!rows.length) {
    coaBody.innerHTML = `<tr><td colspan="4" style="opacity:.7;padding:14px">Sin cuentas. Usa “Cargar plantilla”.</td></tr>`;
    return;
  }

  rows.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(a.code)}</strong></td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(TYPE_LABEL[a.type] || a.type)}</td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ghost" type="button" data-del-coa="${escapeHtml(a.code)}">Borrar</button>
        </div>
      </td>
    `;
    coaBody.appendChild(tr);
  });

  coaBody.querySelectorAll("[data-del-coa]").forEach(b => {
    b.addEventListener("click", () => {
      const code = b.dataset.delCoa;
      if (!confirm(`¿Borrar cuenta ${code}?`)) return;
      const db = loadDB();
      db.coa = (db.coa || []).filter(a => a.code !== code);
      saveDB(db);
      renderCOA();
      refreshAll();
    });
  });
}

/* ========== JOURNAL ========== */
function newEntry() {
  activeEntryId = null;
  entryMode.textContent = "Nuevo";
  eDate.value = isoToday();
  eRef.value = "";
  eMemo.value = "";
  linesWrap.innerHTML = "";
  addLine();
  addLine();
  calcTotals();
}

function addLine(prefill) {
  const db = loadDB();
  const coa = sortCOA(db.coa || []);
  if (!coa.length) {
    alert("Primero carga o crea el Plan de Cuentas.");
    setView("coa");
    return;
  }

  const row = document.createElement("div");
  row.className = "tRow";

  const sel = document.createElement("select");
  sel.className = "input";
  coa.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.code;
    opt.textContent = `${a.code} · ${a.name}`;
    sel.appendChild(opt);
  });

  const debit = document.createElement("input");
  debit.className = "input";
  debit.type = "number";
  debit.step = "0.01";
  debit.placeholder = "0.00";

  const credit = document.createElement("input");
  credit.className = "input";
  credit.type = "number";
  credit.step = "0.01";
  credit.placeholder = "0.00";

  const del = document.createElement("button");
  del.className = "lineDel";
  del.type = "button";
  del.textContent = "×";

  row.appendChild(sel);
  row.appendChild(debit);
  row.appendChild(credit);
  row.appendChild(del);
  linesWrap.appendChild(row);

  if (prefill) {
    sel.value = prefill.account || coa[0].code;
    debit.value = prefill.debit ? String(prefill.debit) : "";
    credit.value = prefill.credit ? String(prefill.credit) : "";
  }

  debit.addEventListener("input", () => {
    if (Number(debit.value || 0) > 0) credit.value = "";
    calcTotals();
  });
  credit.addEventListener("input", () => {
    if (Number(credit.value || 0) > 0) debit.value = "";
    calcTotals();
  });
  sel.addEventListener("change", calcTotals);

  del.addEventListener("click", () => {
    row.remove();
    calcTotals();
  });

  calcTotals();
}

function readLines() {
  const rows = [...linesWrap.querySelectorAll(".tRow")];
  return rows.map(r => {
    const sel = r.querySelector("select");
    const inputs = r.querySelectorAll("input");
    const debit = Number(inputs[0].value || 0);
    const credit = Number(inputs[1].value || 0);
    return { account: sel.value, debit, credit };
  }).filter(l => (l.debit > 0 || l.credit > 0));
}

function calcTotals() {
  const lines = readLines();
  const deb = lines.reduce((a, l) => a + Number(l.debit || 0), 0);
  const cre = lines.reduce((a, l) => a + Number(l.credit || 0), 0);
  const diff = deb - cre;

  tDebit.textContent = fmt(deb);
  tCredit.textContent = fmt(cre);
  tDiff.textContent = fmt(diff);

  tDiff.style.color = Math.abs(diff) < 0.00001 ? "rgba(255,255,255,.92)" : "rgba(239,68,68,.95)";
}

function postEntry() {
  const db = loadDB();
  if (!(db.coa || []).length) return alert("Crea o carga el Plan de Cuentas primero.");

  const date = eDate.value || isoToday();
  const ref = (eRef.value || "").trim();
  const memo = (eMemo.value || "").trim();
  const lines = readLines();

  if (!memo) return alert("La descripción es obligatoria.");
  if (!lines.length) return alert("Añade líneas con monto (Debe/Haber).");

  const deb = lines.reduce((a, l) => a + Number(l.debit || 0), 0);
  const cre = lines.reduce((a, l) => a + Number(l.credit || 0), 0);
  const diff = deb - cre;

  if (Math.abs(diff) > 0.00001) return alert("Debe y Haber no cuadran. Ajusta el asiento.");

  const entry = {
    id: activeEntryId || `j_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    date, ref, memo,
    lines,
    updatedAt: new Date().toISOString(),
  };

  const idx = (db.journal || []).findIndex(e => e.id === entry.id);
  if (idx >= 0) db.journal[idx] = { ...db.journal[idx], ...entry };
  else db.journal.unshift({ ...entry, createdAt: new Date().toISOString() });

  saveDB(db);
  activeEntryId = entry.id;
  entryMode.textContent = "Editando";

  renderJournal();
  refreshAll();
  alert("Asiento registrado ✅");
}

function deleteEntry() {
  if (!activeEntryId) return newEntry();
  if (!confirm("¿Borrar este asiento?")) return;

  const db = loadDB();
  db.journal = (db.journal || []).filter(e => e.id !== activeEntryId);
  saveDB(db);

  newEntry();
  renderJournal();
  refreshAll();
}

function openEntry(id) {
  const db = loadDB();
  const e = (db.journal || []).find(x => x.id === id);
  if (!e) return;

  activeEntryId = e.id;
  entryMode.textContent = "Editando";
  eDate.value = e.date || isoToday();
  eRef.value = e.ref || "";
  eMemo.value = e.memo || "";

  linesWrap.innerHTML = "";
  (e.lines || []).forEach(l => addLine(l));
  if (!(e.lines || []).length) { addLine(); addLine(); }

  calcTotals();
  setView("journal");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderJournal() {
  const db = loadDB();
  const q = (jSearch.value || "").trim().toLowerCase();

  const rows = (db.journal || []).filter(e => {
    if (!q) return true;
    const hay = [e.date, e.ref, e.memo].join(" ").toLowerCase();
    return hay.includes(q);
  });

  jBody.innerHTML = "";
  if (!rows.length) {
    jBody.innerHTML = `<tr><td colspan="5" style="opacity:.7;padding:14px">Sin asientos.</td></tr>`;
    return;
  }

  rows.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(e.date || "")}</td>
      <td>${escapeHtml(e.ref || "—")}</td>
      <td><strong>${escapeHtml(e.memo || "")}</strong></td>
      <td>${escapeHtml(String((e.lines || []).length))}</td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ghost" type="button" data-open="${escapeHtml(e.id)}">Abrir</button>
          <button class="btn danger" type="button" data-del="${escapeHtml(e.id)}">Borrar</button>
        </div>
      </td>
    `;
    jBody.appendChild(tr);
  });

  jBody.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openEntry(b.dataset.open)));
  jBody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    if (!confirm("¿Borrar asiento?")) return;
    const db = loadDB();
    db.journal = (db.journal || []).filter(x => x.id !== b.dataset.del);
    saveDB(db);
    if (activeEntryId === b.dataset.del) newEntry();
    renderJournal();
    refreshAll();
  }));
}

/* ========== REPORTS ========== */
function inRange(iso, from, to) {
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function buildAccountTotals(from, to) {
  const db = loadDB();
  const coaMap = getAccountMap(db.coa || []);
  const totals = new Map();

  (db.journal || []).forEach(e => {
    if (!inRange(e.date, from, to)) return;
    (e.lines || []).forEach(l => {
      const code = l.account;
      if (!totals.has(code)) totals.set(code, { debit: 0, credit: 0 });
      totals.get(code).debit += Number(l.debit || 0);
      totals.get(code).credit += Number(l.credit || 0);
    });
  });

  const rows = [];
  totals.forEach((v, code) => {
    const acc = coaMap.get(code);
    const type = acc?.type || "ASSET";
    const name = acc?.name || "Cuenta";

    // Activo/Gasto: saldo = Debe - Haber; otros: saldo = Haber - Debe
    const saldo = (type === "ASSET" || type === "EXPENSE") ? (v.debit - v.credit) : (v.credit - v.debit);
    rows.push({ code, name, type, debit: v.debit, credit: v.credit, saldo });
  });

  rows.sort((a, b) => String(a.code).localeCompare(String(b.code)));
  return rows;
}

function runReports(from, to) {
  const rows = buildAccountTotals(from, to);

  /* Trial */
  trialBody.innerHTML = "";
  if (!rows.length) {
    trialBody.innerHTML = `<tr><td colspan="5" style="opacity:.7;padding:14px">Sin movimientos en el periodo.</td></tr>`;
  } else {
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(r.code)}</strong></td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(fmt(r.debit))}</td>
        <td>${escapeHtml(fmt(r.credit))}</td>
        <td><strong>${escapeHtml(fmt(r.saldo))}</strong></td>
      `;
      trialBody.appendChild(tr);
    });
  }

  /* P&L */
  const income = rows.filter(r => r.type === "INCOME").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const expense = rows.filter(r => r.type === "EXPENSE").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const net = income - expense;

  plIncome.textContent = fmt(income);
  plExpense.textContent = fmt(expense);
  plNet.textContent = fmt(net);
  plHint.textContent = net >= 0
    ? "Utilidad neta. Esto es lo que te permite crecer sin pedir permiso."
    : "Pérdida neta. Ajusta pricing o recorta gastos. Sin excusas.";

  /* Balance Sheet */
  const assets = rows.filter(r => r.type === "ASSET").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const liab = rows.filter(r => r.type === "LIABILITY").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const equityBase = rows.filter(r => r.type === "EQUITY").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const equity = equityBase + net;

  bsAssets.textContent = fmt(assets);
  bsLiab.textContent = fmt(liab);
  bsEquity.textContent = fmt(equity);

  const diff = assets - (liab + equity);
  bsHint.textContent = Math.abs(diff) < 0.01
    ? "Cuadra: Activo = Pasivo + Patrimonio ✅"
    : `No cuadra por ${fmt(diff)}. Revisa asientos o tipos de cuentas.`;

  /* KPI sync */
  kpiIncome.textContent = fmt(income);
  kpiExpense.textContent = fmt(expense);
}

function renderDashboard() {
  const from = pFrom.value || "";
  const to = pTo.value || "";

  const db = loadDB();
  kpiEntries.textContent = String((db.journal || []).length);

  const rows = buildAccountTotals(from, to);
  const income = rows.filter(r => r.type === "INCOME").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const expense = rows.filter(r => r.type === "EXPENSE").reduce((a, r) => a + Number(r.saldo || 0), 0);
  const net = income - expense;

  kpiIncome.textContent = fmt(income);
  kpiExpense.textContent = fmt(expense);

  dashCards.innerHTML = "";

  const c1 = document.createElement("div");
  c1.className = "dashCard dash-blue";
  c1.innerHTML = `<strong>Resultado del periodo</strong><div class="meta">Net: <b>${escapeHtml(fmt(net))}</b><br>Ingresos ${escapeHtml(fmt(income))} / Gastos ${escapeHtml(fmt(expense))}</div>`;
  dashCards.appendChild(c1);

  const c2 = document.createElement("div");
  c2.className = "dashCard " + (net >= 0 ? "dash-ok" : "dash-bad");
  c2.innerHTML = `<strong>${net >= 0 ? "Operación saludable" : "Operación en rojo"}</strong><div class="meta">${net >= 0 ? "Bien. Ahora escala con control." : "Sin pánico: acción. Ajusta margen o reduce fugas."}</div>`;
  dashCards.appendChild(c2);

  const topExp = rows.filter(r => r.type === "EXPENSE").sort((a, b) => Number(b.saldo) - Number(a.saldo)).slice(0, 5);
  const c3 = document.createElement("div");
  c3.className = "dashCard dash-warn";
  c3.innerHTML = `<strong>Top gastos</strong><div class="meta">${topExp.length ? topExp.map(x => `${escapeHtml(x.code)} ${escapeHtml(x.name)}: <b>${escapeHtml(fmt(x.saldo))}</b>`).join("<br>") : "Sin gastos en el periodo."}</div>`;
  dashCards.appendChild(c3);

  const coaCount = (db.coa || []).length;
  const c4 = document.createElement("div");
  c4.className = "dashCard " + (coaCount ? "dash-ok" : "dash-bad");
  c4.innerHTML = `<strong>Setup</strong><div class="meta">${coaCount ? `Plan de cuentas: <b>${coaCount}</b> cuentas.` : "No hay plan de cuentas. Ve a “Cuentas” y carga plantilla."}</div>`;
  dashCards.appendChild(c4);

  dashStatus.textContent = coaCount ? "Listo" : "Setup pendiente";
}

/* ========== DATA ========== */
function exportJSON() {
  const db = loadDB();
  const payload = { exportedAt: new Date().toISOString(), db };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oasis_contabilidad_${isoToday()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 300);
}

async function importJSON(file) {
  try {
    const txt = await file.text();
    const data = JSON.parse(txt);
    const db = data.db || data;

    if (!db.coa || !Array.isArray(db.coa) || !db.journal || !Array.isArray(db.journal)) {
      alert("Archivo inválido.");
      return;
    }

    saveDB({ coa: db.coa, journal: db.journal });
    renderCOA();
    renderJournal();
    refreshAll();
    newEntry();
    alert("Importado ✅");
  } catch {
    alert("No se pudo importar.");
  }
}

function resetAll() {
  if (!confirm("Reset total: borra cuentas y asientos. ¿Seguro?")) return;
  saveDB({ coa: [], journal: [] });
  renderCOA();
  renderJournal();
  refreshAll();
  newEntry();
}

/* ========== SYNC ========== */
function refreshAll() {
  renderDashboard();
  runReports(rFrom.value || "", rTo.value || "");
}

/* ========== BOOT ========== */
(function boot() {
  // Hub button
  const hubBtn = $("hubBtn");
  if (hubBtn) hubBtn.href = HUB_URL;

  // Period defaults = mes actual
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  pFrom.value = first; pTo.value = last;
  rFrom.value = first; rTo.value = last;
  eDate.value = isoToday();

  // Tabs
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    setView(btn.dataset.view);
  });

  // COA
  btnSeed.addEventListener("click", seedCOA);
  btnClearCOA.addEventListener("click", () => {
    if (!confirm("¿Vaciar plan de cuentas?")) return;
    const db = loadDB();
    db.coa = [];
    saveDB(db);
    renderCOA();
    refreshAll();
  });
  btnAddAccount.addEventListener("click", addAccount);
  coaSearch.addEventListener("input", renderCOA);

  // Journal
  btnNewEntry.addEventListener("click", newEntry);
  btnAddLine.addEventListener("click", () => addLine());
  btnPostEntry.addEventListener("click", postEntry);
  btnDeleteEntry.addEventListener("click", deleteEntry);
  jSearch.addEventListener("input", renderJournal);

  // Period changes
  pFrom.addEventListener("change", refreshAll);
  pTo.addEventListener("change", refreshAll);

  btnRunReports.addEventListener("click", () => runReports(rFrom.value || "", rTo.value || ""));
  rFrom.addEventListener("change", () => runReports(rFrom.value || "", rTo.value || ""));
  rTo.addEventListener("change", () => runReports(rFrom.value || "", rTo.value || ""));

  // Data
  btnExport.addEventListener("click", exportJSON);
  btnImport.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) importJSON(f);
    e.target.value = "";
  });
  btnReset.addEventListener("click", resetAll);

  // First render
  renderCOA();
  renderJournal();
  newEntry();
  refreshAll();
})();
