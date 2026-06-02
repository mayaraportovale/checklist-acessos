const ACESSOS = {
  gerente: [
    {
      secao: "Grupos",
      itens: [
        "Grupo Comunicados",
        "Grupo Porto Vale",
        "Grupo Pendências",
        "Grupo NPS",
        "Grupo Gerentes",
        "Grupo Sistema – Clauser"
      ]
    },
    {
      secao: "Sistemas e Acessos",
      itens: [
        "Inadimplentes",
        "Ololu",
        "Click Play",
        "Acesso NPS",
        "Acesso ao Sys Control",
        "Portal",
        "Power BI",
        "Corretor Online"
      ]
    }
  ],
  vendedor: [
    {
      secao: "Grupos",
      itens: [
        "Grupo Comunicados",
        "Grupo Porto Vale"
      ]
    },
    {
      secao: "Sistemas e Acessos",
      itens: [
        "Ololu",
        "COL",
        "Portal"
      ]
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
  const data = ACESSOS[currentType];
  area.innerHTML = "";

  data.forEach(({ secao, itens }) => {
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
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#0d0f14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2 6 5 9 10 3"/>
          </svg>
        </div>
        <span class="check-label">${item}</span>
      `;
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
  document.getElementById("nome").value = "";
  document.getElementById("responsavel").value = "";
  document.getElementById("data").value = "";
  document.getElementById("motivo").value = "";
  renderChecklist();
  updateProgress();
}

function saveRecord() {
  const nome = document.getElementById("nome").value.trim();
  const responsavel = document.getElementById("responsavel").value.trim();
  const data = document.getElementById("data").value;
  const motivo = document.getElementById("motivo").value;

  if (!nome) { showToast("Informe o nome do colaborador.", "error"); return; }
  if (!data) { showToast("Informe a data.", "error"); return; }

  const totalItens = ACESSOS[currentType].reduce((acc, s) => acc + s.itens.length, 0);
  const done = Object.values(checkedItems).filter(Boolean).length;

  const record = {
    id: Date.now(),
    tipo: currentType,
    nome,
    responsavel,
    data,
    motivo,
    totalItens,
    done,
    itens: {}
  };

  ACESSOS[currentType].forEach(({ itens }) => {
    itens.forEach(item => {
      const key = `${currentType}__${item}`;
      record.itens[item] = !!checkedItems[key];
    });
  });

  const history = getHistory();
  history.unshift(record);
  localStorage.setItem("checklist_history", JSON.stringify(history));

  showToast("Registro salvo com sucesso! ✓", "success");
  clearForm();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("checklist_history")) || [];
  } catch {
    return [];
  }
}

function clearHistory() {
  if (!confirm("Tem certeza que deseja apagar todo o histórico?")) return;
  localStorage.removeItem("checklist_history");
  renderHistory();
  showToast("Histórico apagado.", "");
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
    const badgeClass = r.tipo === "gerente" ? "badge-gerente" : "badge-vendedor";
    const pctClass = pct === 100 ? "" : "partial";
    const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
    const motivo = r.motivo || "—";
    return `
      <div class="history-card" onclick="openModal(${r.id})">
        <span class="history-badge ${badgeClass}">${r.tipo}</span>
        <div class="history-info">
          <div class="history-name">${r.nome}</div>
          <div class="history-meta">${dataFmt} · ${motivo}${r.responsavel ? " · " + r.responsavel : ""}</div>
        </div>
        <div class="history-progress">
          <div class="history-pct ${pctClass}">${pct}%</div>
          <div class="history-pct-label">${r.done}/${r.totalItens} itens</div>
        </div>
      </div>
    `;
  }).join("");
}

function openModal(id) {
  const history = getHistory();
  const r = history.find(x => x.id === id);
  if (!r) return;

  const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const pct = r.totalItens === 0 ? 0 : Math.round((r.done / r.totalItens) * 100);

  document.getElementById("modal-title").textContent = r.nome;

  const sections = ACESSOS[r.tipo];
  let itemsHtml = sections.map(({ secao, itens }) => `
    <div class="modal-section-title">${secao}</div>
    ${itens.map(item => `
      <div class="modal-item">
        <span class="dot ${r.itens[item] ? "dot-ok" : "dot-no"}"></span>
        <span style="color: ${r.itens[item] ? "var(--text)" : "var(--text3)"}; ${r.itens[item] ? "" : "text-decoration:line-through"}">${item}</span>
      </div>
    `).join("")}
  `).join("");

  document.getElementById("modal-body").innerHTML = `
    <div class="modal-meta">
      <div class="modal-meta-item"><label>Tipo</label><span style="text-transform:capitalize">${r.tipo}</span></div>
      <div class="modal-meta-item"><label>Data</label><span>${dataFmt}</span></div>
      <div class="modal-meta-item"><label>Responsável</label><span>${r.responsavel || "—"}</span></div>
      <div class="modal-meta-item"><label>Motivo</label><span>${r.motivo || "—"}</span></div>
      <div class="modal-meta-item"><label>Conclusão</label><span style="color:${pct===100?"var(--green)":"var(--amber)"};font-weight:600">${pct}% (${r.done}/${r.totalItens})</span></div>
    </div>
    ${itemsHtml}
  `;

  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

function showPage(page) {
  document.getElementById("page-form").classList.toggle("hidden", page !== "form");
  document.getElementById("page-history").classList.toggle("hidden", page !== "history");
  if (page === "history") renderHistory();
}

let toastTimer;
function showToast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.add("hidden"); }, 2800);
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("data").value = today;
  renderChecklist();
  updateProgress();
});
