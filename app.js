const ACESSOS = {
  gerente: [
    {
      secao: "Grupos",
      itens: ["Grupo Comunicados","Grupo Porto Vale","Grupo Pendências","Grupo NPS","Grupo Gerentes","Grupo Sistema – Clauser"]
    },
    {
      secao: "Sistemas e Acessos",
      itens: ["Inadimplentes","Ololu","Click Play","Acesso NPS","Acesso ao Sys Control","Portal","Power BI","Corretor Online"]
    }
  ],
  vendedor: [
    {
      secao: "Grupos",
      itens: ["Grupo Comunicados","Grupo Porto Vale"]
    },
    {
      secao: "Sistemas e Acessos",
      itens: ["Ololu","COL","Portal"]
    }
  ]
};

let currentType = "gerente";
let checkedItems = {};

function selectType(type) {
  currentType = type;
  checkedItems = {};
  document.getElementById("btn-gerente").classList.toggle("active", type === "gerente");
  document.getElementById("btn-vendedor").classList.toggle("active", type === "vendedor");
  renderChecklist();
  updateProgress();
}

function renderChecklist() {
  const area = document.getElementById("checklist-area");
  area.innerHTML = "";
  ACESSOS[currentType].forEach(({ secao, itens }) => {
    const section = document.createElement("div");
    section.className = "checklist-section";
    const title = document.createElement("h4");
    title.textContent = secao;
    section.appendChild(title);
    const itemsDiv = document.createElement("div");
    itemsDiv.className = "checklist-items";
    itens.forEach(item => {
      const key = `${currentType}__${item}`;
      const div = document.createElement("div");
      div.className = "check-item" + (checkedItems[key] ? " checked" : "");
      div.onclick = () => toggleItem(key, div);
      div.innerHTML = `
        <div class="check-box">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#0d0f14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
        </div>
        <span class="check-label">${item}</span>`;
      itemsDiv.appendChild(div);
    });
    section.appendChild(itemsDiv);
    area.appendChild(section);
  });
}

function toggleItem(key, el) {
  checkedItems[key] = !checkedItems[key];
  el.classList.toggle("checked", checkedItems[key]);
  updateProgress();
}

function updateProgress() {
  const total = ACESSOS[currentType].reduce((acc, s) => acc + s.itens.length, 0);
  const done = Object.values(checkedItems).filter(Boolean).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-label").textContent = `${done} / ${total}`;
}

function clearForm() {
  checkedItems = {};
  ["nome","responsavel","obs"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  document.getElementById("data").value = new Date().toISOString().split("T")[0];
  document.getElementById("motivo").value = "";
  renderChecklist();
  updateProgress();
}

function saveRecord() {
  const nome = document.getElementById("nome").value.trim();
  const data = document.getElementById("data").value;
  if (!nome) { showToast("Informe o nome do colaborador.", "error"); return; }
  if (!data) { showToast("Informe a data.", "error"); return; }

  const total = ACESSOS[currentType].reduce((acc, s) => acc + s.itens.length, 0);
  const done = Object.values(checkedItems).filter(Boolean).length;

  const record = {
    id: Date.now(),
    tipo: currentType,
    nome,
    responsavel: document.getElementById("responsavel").value.trim(),
    data,
    motivo: document.getElementById("motivo").value,
    obs: document.getElementById("obs").value.trim(),
    totalItens: total,
    done,
    itens: {}
  };
  ACESSOS[currentType].forEach(({ itens }) => {
    itens.forEach(item => { record.itens[item] = !!checkedItems[`${currentType}__${item}`]; });
  });

  const history = getHistory();
  history.unshift(record);
  localStorage.setItem("checklist_history", JSON.stringify(history));
  showToast("Registro salvo! ✓", "success");
  clearForm();
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem("checklist_history")) || []; }
  catch { return []; }
}

function clearHistory() {
  if (!confirm("Apagar todo o histórico?")) return;
  localStorage.removeItem("checklist_history");
  renderHistory();
  showToast("Histórico apagado.");
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const history = getHistory();
  if (history.length === 0) {
    list.innerHTML = '<div class="history-empty">Nenhum registro salvo ainda.</div>';
    return;
  }
  list.innerHTML = history.map(r => {
    const pct = r.totalItens === 0 ? 0 : Math.round((r.done / r.totalItens) * 100);
    const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    return `
      <div class="history-card" onclick="openModal(${r.id})">
        <span class="history-badge badge-${r.tipo}">${r.tipo}</span>
        <div class="history-info">
          <div class="history-name">${r.nome}</div>
          <div class="history-meta">${dataFmt}${r.motivo ? " · " + r.motivo : ""}${r.responsavel ? " · " + r.responsavel : ""}</div>
        </div>
        <div class="history-progress">
          <div class="history-pct ${pct === 100 ? "" : "partial"}">${pct}%</div>
          <div class="history-pct-label">${r.done}/${r.totalItens} itens</div>
        </div>
      </div>`;
  }).join("");
}

function openModal(id) {
  const r = getHistory().find(x => x.id === id);
  if (!r) return;
  const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const pct = r.totalItens === 0 ? 0 : Math.round((r.done / r.totalItens) * 100);
  document.getElementById("modal-title").textContent = r.nome;
  const sections = ACESSOS[r.tipo];
  const itemsHtml = sections.map(({ secao, itens }) => `
    <div class="modal-section-title">${secao}</div>
    ${itens.map(item => `
      <div class="modal-item">
        <span class="dot ${r.itens[item] ? "dot-ok" : "dot-no"}"></span>
        <span style="color:${r.itens[item] ? "var(--text)" : "var(--text3)"};${r.itens[item] ? "" : "text-decoration:line-through"}">${item}</span>
      </div>`).join("")}`).join("");
  document.getElementById("modal-body").innerHTML = `
    <div class="modal-meta">
      <div class="modal-meta-item"><label>Tipo</label><span style="text-transform:capitalize">${r.tipo}</span></div>
      <div class="modal-meta-item"><label>Data</label><span>${dataFmt}</span></div>
      <div class="modal-meta-item"><label>Responsável</label><span>${r.responsavel || "—"}</span></div>
      <div class="modal-meta-item"><label>Motivo</label><span>${r.motivo || "—"}</span></div>
      <div class="modal-meta-item"><label>Conclusão</label><span style="color:${pct===100?"var(--green)":"var(--amber)"};font-weight:600">${pct}% (${r.done}/${r.totalItens})</span></div>
      ${r.obs ? `<div class="modal-meta-item" style="grid-column:span 2"><label>Observações</label><span>${r.obs}</span></div>` : ""}
    </div>
    ${itemsHtml}`;
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() { document.getElementById("modal-overlay").classList.add("hidden"); }

function showPage(page) {
  document.getElementById("page-form").classList.toggle("hidden", page !== "form");
  document.getElementById("page-history").classList.toggle("hidden", page !== "history");
  if (page === "history") renderHistory();
}

// ─── XLSX EXPORT ─────────────────────────────────────────────────────────────
function exportXLSX() {
  const history = getHistory();
  if (history.length === 0) { showToast("Nenhum registro para exportar.", "error"); return; }

  const allItems = [
    ...ACESSOS.gerente.flatMap(s => s.itens),
    ...ACESSOS.vendedor.flatMap(s => s.itens)
  ];
  const uniqueItems = [...new Set(allItems)];

  const headers = ["Tipo","Nome","Responsável","Data","Motivo","Observações","Concluído (%)","Itens OK / Total",...uniqueItems];

  const rows = history.map(r => {
    const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "";
    const pct = r.totalItens === 0 ? 0 : Math.round((r.done / r.totalItens) * 100);
    const base = [
      r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1),
      r.nome, r.responsavel || "", dataFmt,
      r.motivo || "", r.obs || "",
      pct + "%", `${r.done}/${r.totalItens}`
    ];
    const itemCols = uniqueItems.map(item => {
      if (r.itens[item] === undefined) return "N/A";
      return r.itens[item] ? "✓" : "✗";
    });
    return [...base, ...itemCols];
  });

  // Use SheetJS to create a real .xlsx
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  const colWidths = headers.map((h, i) => {
    if (i === 0) return { wch: 12 };
    if (i === 1) return { wch: 22 };
    if (i === 2) return { wch: 20 };
    if (i === 3) return { wch: 12 };
    if (i === 4) return { wch: 16 };
    if (i === 5) return { wch: 28 };
    if (i === 6) return { wch: 13 };
    if (i === 7) return { wch: 14 };
    return { wch: 22 };
  });
  ws['!cols'] = colWidths;

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, "Registros");

  // Summary sheet
  const totalRegistros = history.length;
  const totalGerentes = history.filter(r => r.tipo === "gerente").length;
  const totalVendedores = history.filter(r => r.tipo === "vendedor").length;
  const mediaConc = history.length
    ? Math.round(history.reduce((acc, r) => acc + (r.totalItens ? r.done / r.totalItens * 100 : 0), 0) / history.length)
    : 0;
  const totalCompletos = history.filter(r => r.totalItens && r.done === r.totalItens).length;

  const summaryData = [
    ["📊 Resumo do Histórico", ""],
    ["", ""],
    ["Total de registros", totalRegistros],
    ["Gerentes", totalGerentes],
    ["Vendedores", totalVendedores],
    ["", ""],
    ["Média de conclusão", mediaConc + "%"],
    ["Checklists 100% completos", totalCompletos],
    ["", ""],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
  XLSX.writeFile(wb, `checklist_acessos_${stamp}.xlsx`);
  showToast("Exportado em .xlsx ✓", "success");
}

let toastTimer;
function showToast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = "toast" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2800);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data").value = new Date().toISOString().split("T")[0];
  renderChecklist();
  updateProgress();
});
