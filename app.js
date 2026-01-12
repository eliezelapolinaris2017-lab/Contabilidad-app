/* Oasis Contabilidad — Profesional (sin backend, GitHub ready) */
const HUB_URL = "https://eliezelapolinaris2017-lab.github.io/oasis-hub/";
const KEY = "oasis_accounting_pro_v1";

const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0));
const isoToday = () => new Date().toISOString().slice(0,10);

const escapeHtml = (s="") =>
  String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));

/* Tabs */
const tabs = $("tabs");
const views = {
  dash: $("view-dash"),
  coa: $("view-coa"),
  journal: $("view-journal"),
  reports: $("view-reports"),
  data: $("view-data"),
};
function setView(name){
  Object.keys(views).forEach(k => views[k].classList.toggle("is-active", k===name));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("is-active", t.dataset.view===name));
}

/* KPI */
const kpiEntries = $("kpiEntries");
const kpiIncome = $("kpiIncome");
const kpiExpense = $("kpiExpense");
const dashStatus = $("dashStatus");

/* Period inputs */
const pFrom = $("pFrom");
const pTo = $("pTo");
const rFrom = $("rFrom");
const rTo = $("rTo");

/* Dashboard cards */
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

/* State */
let activeEntryId = null;

/* Storage */
function loadDB(){
  return JSON.parse(localStorage.getItem(KEY) || JSON.stringify({
    coa: [],
    journal: []
  }));
}
function saveDB(db){ localStorage.setItem(KEY, JSON.stringify(db)); }

/* COA helpers */
const TYPE_LABEL = {
  ASSET:"Activo",
  LIABILITY:"Pasivo",
  EQUITY:"Patrimonio",
  INCOME:"Ingresos",
  EXPENSE:"Gastos"
};
function sortCOA(coa){
  return [...coa].sort((a,b)=> String(a.code).localeCompare(String(b.code)));
}
function getAccountMap(coa){
  const map = new Map();
  coa.forEach(a=> map.set(a.code, a));
  return map;
}

/* Date helpers */
function inRange(iso, from, to){
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

/* Seed chart of accounts (plantilla) */
function seedCOA(){
  const base = [
    {code:"1000", name:"Activo", type:"ASSET"},
    {code:"1100", name:"Caja / Banco", type:"ASSET"},
    {code:"1200", name:"Cuentas por Cobrar", type:"ASSET"},
    {code:"1300", name:"Inventario", type:"ASSET"},
    {code:"1400", name:"Equipo / Herramientas", type:"ASSET"},

    {code:"2000", name:"Pasivo", type:"LIABILITY"},
    {code:"2100", name:"Cuentas por Pagar", type:"LIABILITY"},
    {code:"2200", name:"Impuestos por Pagar", type:"LIABILITY"},

    {code:"3000", name:"Patrimonio", type:"EQUITY"},
    {code:"3100", name:"Capital", type:"EQUITY"},
    {code:"3200", name:"Utilidad/Perdida del Periodo", type:"EQUITY"},

    {code:"4000", name:"Ingresos", type:"INCOME"},
    {code:"4100", name:"Ventas / Servicios", type:"INCOME"},

    {code:"5000", name:"Gastos", type:"EXPENSE"},
    {code:"5100", name:"Materiales / Repuestos", type:"EXPENSE"},
    {code:"5200", name:"Combustible / Transporte", type:"EXPENSE"},
    {code:"5300", name:"Herramientas / Mantenimiento", type:"EXPENSE"},
    {code:"5400", name:"Teléfono / Internet", type:"EXPENSE"},
    {code:"5500", name:"Renta / Oficina", type:"EXPENSE"},
    {code:"5600", name:"Publicidad / Marketing", type:"EXPENSE"},
  ];
  const db = loadDB();
  const existing = new Set(db.coa.map(a=>a.code));
  base.forEach(a=>{
    if (!existing.has(a.code)) db.coa.push({...a, createdAt:new Date().toISOString()});
  });
  saveDB(db);
  renderCOA();
  refreshAll();
}

/* Render COA */
function renderCOA(){
  const db = loadDB();
  const q = (coaSearch.value||"").trim().toLowerCase();
  const rows = sortCOA(db.coa||[]).filter(a=>{
    if (!q) return true;
    const hay = [a.code,a.name,TYPE_LABEL[a.type]||a.type].join(" ").toLowerCase();
    return hay.includes(q);
  });

  coaBody.innerHTML = "";
  if (!rows.length){
    coaBody.innerHTML = `<tr><td colspan="4" style="opacity:.7;padding:14px">Sin cuentas. Usa “Cargar plantilla”.</td></tr>`;
    return;
  }

  rows.forEach(a=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(a.code)}</strong></td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(TYPE_LABEL[a.type]||a.type)}</td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ghost" type="button" data-use="${escapeHtml(a.code)}">Usar</button>
          <button class="btn danger" type="button" data-del="${escapeHtml(a.code)}">Borrar</button>
        </div>
      </td>
    `;
    coaBody.appendChild(tr);
  });

  coaBody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const code = b.dataset.del;
      if (!confirm(`¿Borrar cuenta ${code}?`)) return;
      const db = loadDB();
      db.coa = db.coa.filter(a=>a.code!==code);
      saveDB(db);
      renderCOA();
      refreshAll();
    });
  });

  coaBody.querySelectorAll("[data-use]").forEach(b=>{
    b.addEventListener("click", ()=>{
      // Solo ayuda: copiar código a clipboard
      const code = b.dataset.use;
      navigator.clipboard?.writeText(code).then(()=>{
        alert(`Copiado: ${code} ✅`);
      }).catch(()=> alert(`Cuenta: ${code}`));
    });
  });
}

function addAccount(){
  const code = (aCode.value||"").trim();
  const name = (aName.value||"").trim();
  const type = aType.value;

  if (!code || !name) { alert("Código y nombre son obligatorios."); return; }

  const db = loadDB();
  if (db.coa.some(a=>a.code===code)){
    alert("Ese código ya existe.");
    return;
  }
  db.coa.push({ code, name, type, createdAt: new Date().toISOString() });
  saveDB(db);

  aCode.value = ""; aName.value = "";
  renderCOA();
  refreshAll();
}

/* Journal: entry builder */
function newEntry(){
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

function addLine(line){
  const db = loadDB();
  const coa = sortCOA(db.coa||[]);
  if (!coa.length){
    alert("Primero crea el Plan de Cuentas (Cargar plantilla).");
    setView("coa");
    return;
  }

  const row = document.createElement("div");
  row.className = "tRow";

  const sel = document.createElement("select");
  sel.className = "input";
  sel.style.borderRadius = "12px";
  coa.forEach(a=>{
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

  if (line){
    sel.value = line.account || coa[0].code;
    debit.value = line.debit ? String(line.debit) : "";
    credit.value = line.credit ? String(line.credit) : "";
  }

  const enforce = (changed) => {
    // si escribes en Debe, limpia Haber y viceversa
    if (changed === "debit" && Number(debit.value||0) > 0) credit.value = "";
    if (changed === "credit" && Number(credit.value||0) > 0) debit.value = "";
    calcTotals();
  };

  debit.addEventListener("input", ()=>enforce("debit"));
  credit.addEventListener("input", ()=>enforce("credit"));
  sel.addEventListener("change", calcTotals);

  del.addEventListener("click", ()=>{
    row.remove();
    calcTotals();
  });

  calcTotals();
}

function readLines(){
  const rows = [...linesWrap.querySelectorAll(".tRow")];
  const lines = rows.map(r=>{
    const [sel, d, c] = r.querySelectorAll("select,input");
    const debit = Number(d.value||0);
    const credit = Number(c.value||0);
    return {
      account: sel.value,
      debit: debit || 0,
      credit: credit || 0
    };
  }).filter(l => (l.debit>0 || l.credit>0));
  return lines;
}

function calcTotals(){
  const lines = readLines();
  const deb = lines.reduce((a,l)=>a+Number(l.debit||0),0);
  const cre = lines.reduce((a,l)=>a+Number(l.credit||0),0);
  const diff = deb - cre;

  tDebit.textContent = fmt(deb);
  tCredit.textContent = fmt(cre);
  tDiff.textContent = fmt(diff);

  // “semáforo” simple: diferencia 0 = OK
  tDiff.style.color = Math.abs(diff) < 0.00001 ? "rgba(255,255,255,.92)" : "rgba(239,68,68,.95)";
}

function postEntry(){
  const db = loadDB();
  if (!db.coa.length){ alert("Crea Plan de Cuentas primero."); setView("coa"); return; }

  const date = eDate.value || isoToday();
  const ref = (eRef.value||"").trim();
  const memo = (eMemo.value||"").trim();
  const lines = readLines();

  if (!memo || !lines.length){
    alert("Descripción y al menos una línea con monto son obligatorios.");
    return;
  }

  const deb = lines.reduce((a,l)=>a+Number(l.debit||0),0);
  const cre = lines.reduce((a,l)=>a+Number(l.credit||0),0);
  const diff = deb - cre;

  if (Math.abs(diff) > 0.00001){
    alert("Debe y Haber no cuadran. Ajusta el asiento.");
    return;
  }

  const entry = {
    id: activeEntryId || `j_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    date, ref, memo,
    lines,
    createdAt: activeEntryId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const idx = db.journal.findIndex(e=>e.id===entry.id);
  if (idx >= 0) db.journal[idx] = { ...db.journal[idx], ...entry };
  else db.journal.unshift(entry);

  saveDB(db);
  activeEntryId = entry.id;
  entryMode.textContent = "Editando";
  renderJournal();
  refreshAll();
  alert("Asiento registrado ✅");
}

function deleteEntry(){
  if (!activeEntryId){
    newEntry();
    return;
  }
  if (!confirm("¿Borrar este asiento?")) return;
  const db = loadDB();
  db.journal = db.journal.filter(e=>e.id!==activeEntryId);
  saveDB(db);
  newEntry();
  renderJournal();
  refreshAll();
}

function openEntry(id){
  const db = loadDB();
  const e = db.journal.find(x=>x.id===id);
  if (!e) return;

  activeEntryId = e.id;
  entryMode.textContent = "Editando";
  eDate.value = e.date || isoToday();
  eRef.value = e.ref || "";
  eMemo.value = e.memo || "";

  linesWrap.innerHTML = "";
  (e.lines || []).forEach(l => addLine(l));
  if (!(e.lines||[]).length){ addLine(); addLine(); }

  calcTotals();
  setView("journal");
  window.scrollTo({top:0,behavior:"smooth"});
}

/* Render Journal */
function renderJournal(){
  const db = loadDB();
  const q = (jSearch.value||"").trim().toLowerCase();

  const rows = (db.journal||[]).filter(e=>{
    if (!q) return true;
    const hay = [e.date,e.ref,e.memo].join(" ").toLowerCase();
    return hay.includes(q);
  });

  jBody.innerHTML = "";
  if (!rows.length){
    jBody.innerHTML = `<tr><td colspan="5" style="opacity:.7;padding:14px">Sin asientos.</td></tr>`;
    return;
  }

  rows.forEach(e=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(e.date||"")}</td>
      <td>${escapeHtml(e.ref||"—")}</td>
      <td><strong>${escapeHtml(e.memo||"")}</strong></td>
      <td>${escapeHtml(String((e.lines||[]).length))}</td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ghost" type="button" data-open="${escapeHtml(e.id)}">Abrir</button>
          <button class="btn danger" type="button" data-del="${escapeHtml(e.id)}">Borrar</button>
        </div>
      </td>
    `;
    jBody.appendChild(tr);
  });

  jBody.querySelectorAll("[data-open]").forEach(b=> b.addEventListener("click", ()=>openEntry(b.dataset.open)));
  jBody.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      if (!confirm("¿Borrar asiento?")) return;
      const db = loadDB();
      db.journal = db.journal.filter(x=>x.id!==b.dataset.del);
      saveDB(db);
      if (activeEntryId===b.dataset.del) newEntry();
      renderJournal();
      refreshAll();
    });
  });
}

/* Posting engine: build totals by account */
function buildAccountTotals(from, to){
  const db = loadDB();
  const coaMap = getAccountMap(db.coa||[]);
  const totals = new Map(); // code => {debit,credit}

  (db.journal||[]).forEach(e=>{
    if (!inRange(e.date, from, to)) return;
    (e.lines||[]).forEach(l=>{
      const code = l.account;
      if (!totals.has(code)) totals.set(code, {debit:0,credit:0});
      totals.get(code).debit += Number(l.debit||0);
      totals.get(code).credit += Number(l.credit||0);
    });
  });

  // compute saldo (según tipo)
  const rows = [];
  totals.forEach((v, code)=>{
    const acc = coaMap.get(code);
    const type = acc?.type || "ASSET";
    const name = acc?.name || "Cuenta";

    // saldo contable: Activo/Gasto aumenta con Debe; Pasivo/Patrimonio/Ingreso aumenta con Haber
    let saldo = 0;
    if (type==="ASSET" || type==="EXPENSE") saldo = v.debit - v.credit;
    else saldo = v.credit - v.debit;

    rows.push({ code, name, type, debit:v.debit, credit:v.credit, saldo });
  });

  // también incluir cuentas sin movimientos para reportes? (no hace falta en MVP)
  rows.sort((a,b)=> String(a.code).localeCompare(String(b.code)));
  return rows;
}

/* Reports */
function runReports(from, to){
  const db = loadDB();
  const rows = buildAccountTotals(from, to);

  // Trial balance
  trialBody.innerHTML = "";
  if (!rows.length){
    trialBody.innerHTML = `<tr><td colspan="5" style="opacity:.7;padding:14px">Sin movimientos en el periodo.</td></tr>`;
  } else {
    rows.forEach(r=>{
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

  // P&L
  const income = rows.filter(r=>r.type==="INCOME").reduce((a,r)=>a+Number(r.saldo||0),0);
  const expense = rows.filter(r=>r.type==="EXPENSE").reduce((a,r)=>a+Number(r.saldo||0),0);
  const net = income - expense;

  plIncome.textContent = fmt(income);
  plExpense.textContent = fmt(expense);
  plNet.textContent = fmt(net);
  plHint.textContent = net >= 0 ? "Utilidad neta (bien). Mantén el margen y controla gastos." : "Pérdida neta. Ajusta pricing o recorta fugas de gasto.";

  // Balance Sheet (assets vs liabilities+equity)
  const assets = rows.filter(r=>r.type==="ASSET").reduce((a,r)=>a+Number(r.saldo||0),0);
  const liab = rows.filter(r=>r.type==="LIABILITY").reduce((a,r)=>a+Number(r.saldo||0),0);
  const equityBase = rows.filter(r=>r.type==="EQUITY").reduce((a,r)=>a+Number(r.saldo||0),0);

  // Opción simple: incluir utilidad del periodo dentro de patrimonio (para que cuadre más)
  const equity = equityBase + net;

  bsAssets.textContent = fmt(assets);
  bsLiab.textContent = fmt(liab);
  bsEquity.textContent = fmt(equity);

  const diff = assets - (liab + equity);
  bsHint.textContent = Math.abs(diff) < 0.01 ? "Cuadra: Activo = Pasivo + Patrimonio ✅" : `No cuadra por ${fmt(diff)}. Revisa asientos o tipos de cuentas.`;

  // KPI sync
  kpiIncome.textContent = fmt(income);
  kpiExpense.textContent = fmt(expense);
}

/* Dashboard */
function renderDashboard(){
  const from = pFrom.value || "";
  const to = pTo.value || "";

  const db = loadDB();
  const entriesCount = (db.journal||[]).length;
  kpiEntries.textContent = entriesCount;

  const rows = buildAccountTotals(from, to);
  const income = rows.filter(r=>r.type==="INCOME").reduce((a,r)=>a+Number(r.saldo||0),0);
  const expense = rows.filter(r=>r.type==="EXPENSE").reduce((a,r)=>a+Number(r.saldo||0),0);
  const net = income - expense;

  kpiIncome.textContent = fmt(income);
  kpiExpense.textContent = fmt(expense);

  dashCards.innerHTML = "";

  const c1 = document.createElement("div");
  c1.className = "dashCard dash-blue";
  c1.innerHTML = `<strong>Resultado del periodo</strong><div class="meta">Net: <b>${escapeHtml(fmt(net))}</b>. Ingresos ${escapeHtml(fmt(income))} / Gastos ${escapeHtml(fmt(expense))}</div>`;
  dashCards.appendChild(c1);

  const health = document.createElement("div");
  health.className = "dashCard " + (net>=0 ? "dash-ok" : "dash-bad");
  health.innerHTML = `<strong>${net>=0 ? "Operación saludable" : "Operación en rojo"}</strong><div class="meta">${net>=0 ? "Buen trabajo. Ahora escala con control." : "Sin pánico, pero sin negación: sube margen o baja gasto."}</div>`;
  dashCards.appendChild(health);

  // Top gastos (by saldo)
  const topExp = rows.filter(r=>r.type==="EXPENSE").sort((a,b)=>Number(b.saldo)-Number(a.saldo)).slice(0,5);
  const expCard = document.createElement("div");
  expCard.className = "dashCard dash-warn";
  expCard.innerHTML = `<strong>Top gastos</strong><div class="meta">${topExp.length ? topExp.map(x=>`${escapeHtml(x.code)} ${escapeHtml(x.name)}: <b>${escapeHtml(fmt(x.saldo))}</b>`).join("<br>") : "No hay gastos en el periodo."}</div>`;
  dashCards.appendChild(expCard);

  const coaCount = (db.coa||[]).length;
  const setup = document.createElement("div");
  setup.className = "dashCard " + (coaCount ? "dash-ok" : "dash-bad");
  setup.innerHTML = `<strong>Setup</strong><div class="meta">${coaCount ? `Plan de cuentas: <b>${coaCount}</b> cuentas.` : "No hay plan de cuentas. Ve a “Cuentas” y carga plantilla."}</div>`;
  dashCards.appendChild(setup);

  dashStatus.textContent = coaCount ? "Listo" : "Setup pendiente";
}

/* Data export/import/reset */
function exportJSON(){
  const db = loadDB();
  const payload = { exportedAt: new Date().toISOString(), db };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oasis_contabilidad_${isoToday()}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 300);
}

async function importJSON(file){
  try{
    const txt = await file.text();
    const data = JSON.parse(txt);
    const db = data.db || data;
    if (!db.coa || !Array.isArray(db.coa) || !db.journal || !Array.isArray(db.journal)){
      alert("Archivo inválido.");
      return;
    }
    saveDB({ coa: db.coa, journal: db.journal });
    renderCOA();
    renderJournal();
    refreshAll();
    newEntry();
    alert("Importado ✅");
  }catch{
    alert("No se pudo importar.");
  }
}

function resetAll(){
  if (!confirm("Reset total: borra cuentas y asientos. ¿Seguro?")) return;
  saveDB({ coa: [], journal: [] });
  renderCOA();
  renderJournal();
  refreshAll();
  newEntry();
}

/* Sync all */
function refreshAll(){
  renderDashboard();
  runReports(rFrom.value||"", rTo.value||"");
}

/* Boot */
(function boot(){
  $("hubBtn").href = HUB_URL;

  // defaults: periodo mes actual
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);

  pFrom.value = first; pTo.value = last;
  rFrom.value = first; rTo.value = last;

  eDate.value = isoToday();

  tabs.addEventListener("click", (e)=>{
    const btn = e.target.closest(".tab");
    if (!btn) return;
    setView(btn.dataset.view);
  });

  btnSeed.addEventListener("click", seedCOA);
  btnClearCOA.addEventListener("click", ()=>{
    if (!confirm("¿Vaciar plan de cuentas?")) return;
    const db = loadDB();
    db.coa = [];
    saveDB(db);
    renderCOA();
    refreshAll();
  });
  btnAddAccount.addEventListener("click", addAccount);
  coaSearch.addEventListener("input", renderCOA);

  btnNewEntry.addEventListener("click", newEntry);
  btnAddLine.addEventListener("click", ()=>addLine());
  btnPostEntry.addEventListener("click", postEntry);
  btnDeleteEntry.addEventListener("click", deleteEntry);
  jSearch.addEventListener("input", renderJournal);

  pFrom.addEventListener("change", refreshAll);
  pTo.addEventListener("change", refreshAll);
  btnRunReports.addEventListener("click", ()=>runReports(rFrom.value||"", rTo.value||""));
  rFrom.addEventListener("change", ()=>runReports(rFrom.value||"", rTo.value||| "");
  );
  rTo.addEventListener("change", ()=>runReports(rFrom.value||"", rTo.value||""));

  btnExport.addEventListener("click", exportJSON);
  btnImport.addEventListener("click", ()=>importFile.click());
  importFile.addEventListener("change", (e)=>{
    const f = e.target.files?.[0];
    if (f) importJSON(f);
    e.target.value = "";
  });
  btnReset.addEventListener("click", resetAll);

  // initial renders
  renderCOA();
  renderJournal();
  newEntry();
  refreshAll();
})();
