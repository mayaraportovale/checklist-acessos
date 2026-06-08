/* ═══════════════════════════════════════════════
   PORTO VALE — app.js
   Checklist de Encerramento de Acessos
═══════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────
// DADOS: ACESSOS POR CARGO
// ─────────────────────────────────────────────
const ACESSOS = {
  gerente: [
    { id: 'g01', nome: 'ERP — Módulo Vendas',       categoria: 'Sistemas' },
    { id: 'g02', nome: 'ERP — Módulo Financeiro',   categoria: 'Sistemas' },
    { id: 'g03', nome: 'ERP — Relatórios',          categoria: 'Sistemas' },
    { id: 'g04', nome: 'CRM — Admin',               categoria: 'Sistemas' },
    { id: 'g05', nome: 'BI / Dashboard gerencial',  categoria: 'Sistemas' },
    { id: 'g06', nome: 'E-mail corporativo',        categoria: 'Comunicação' },
    { id: 'g07', nome: 'Microsoft Teams',           categoria: 'Comunicação' },
    { id: 'g08', nome: 'SharePoint / Drive',        categoria: 'Comunicação' },
    { id: 'g09', nome: 'VPN corporativa',           categoria: 'Infraestrutura' },
    { id: 'g10', nome: 'Crachá / Controle de acesso físico', categoria: 'Infraestrutura' },
    { id: 'g11', nome: 'Computador / Equipamentos', categoria: 'Infraestrutura' },
    { id: 'g12', nome: 'Cofre / Chaves de almoxarifado', categoria: 'Infraestrutura' },
    { id: 'g13', nome: 'Certificados digitais',     categoria: 'Financeiro' },
    { id: 'g14', nome: 'Procurações / Poderes bancários', categoria: 'Financeiro' },
  ],
  vendedor: [
    { id: 'v01', nome: 'ERP — Módulo Vendas',  categoria: 'Sistemas' },
    { id: 'v02', nome: 'CRM — Perfil padrão',  categoria: 'Sistemas' },
    { id: 'v03', nome: 'E-mail corporativo',   categoria: 'Comunicação' },
    { id: 'v04', nome: 'Microsoft Teams',      categoria: 'Comunicação' },
    { id: 'v05', nome: 'Crachá / Controle de acesso físico', categoria: 'Infraestrutura' },
  ],
};

const RESPONSAVEIS = [
  'Ana Paula',
  'Carlos Mendes',
  'Fernanda Lima',
  'Guilherme Rocha',
  'Isabela Torres',
  'José Alves',
  'Mariana Costa',
  'Pedro Henrique',
  'Renata Oliveira',
  'Thiago Barbosa',
];

// ─────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────
let state = {
  step:      1,
  tipo:      null,
  nome:      '',
  data:      '',
  motivo:    '',
  checklist: {},   // { id: { done: bool, by: string, at: string } }
  dpEnviado: false,
  dpData:    '',
  dpObs:     '',
  revisadoPor: '',
  enviadoPor:  '',
  s2Resp:      '',
};

let records = loadRecords();
let currentRecordId = null;

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
function loadRecords() {
  try { return JSON.parse(localStorage.getItem('pv_records') || '[]'); }
  catch { return []; }
}

function saveRecords() {
  localStorage.setItem('pv_records', JSON.stringify(records));
}

function saveDraft() {
  localStorage.setItem('pv_draft', JSON.stringify({ state, currentRecordId }));
}

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem('pv_draft') || 'null');
    if (d) { state = d.state; currentRecordId = d.currentRecordId; }
  } catch {}
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  loadDraft();

  // restaura UI se havia draft
  if (state.tipo) {
    document.querySelector(`#tc-${state.tipo}`)?.classList.add('selected');
    document.getElementById('s1-nome').value  = state.nome;
    document.getElementById('s1-data').value  = state.data;
    document.getElementById('s1-motivo').value = state.motivo;
  }

  // data padrão = hoje
  if (!document.getElementById('s1-data').value) {
    document.getElementById('s1-data').value = todayISO();
  }

  updateStepBar(state.step);
  showStep(state.step);
});

function populateSelects() {
  const ids = ['s2-resp', 's3-resp', 's4-resp'];
  ids.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    RESPONSAVEIS.forEach(r => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = r;
      sel.appendChild(opt);
    });
  });
}

// ─────────────────────────────────────────────
// STEP NAVIGATION
// ─────────────────────────────────────────────
function showStep(n) {
  document.querySelectorAll('.step-view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`step-${n}`);
  if (el) el.classList.add('active');
  state.step = n;
  saveDraft();
}

function updateStepBar(active) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`si-${i}`);
    if (!el) continue;
    el.classList.remove('active','done');
    if (i < active)  el.classList.add('done');
    if (i === active) el.classList.add('active');
  }
}

function goStep(n) {
  updateStepBar(n);
  showStep(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// STEP 1
// ─────────────────────────────────────────────
function selectTipo(t) {
  state.tipo = t;
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`tc-${t}`)?.classList.add('selected');
}

function goStep2() {
  state.nome   = document.getElementById('s1-nome').value.trim();
  state.data   = document.getElementById('s1-data').value;
  state.motivo = document.getElementById('s1-motivo').value;

  if (!state.nome) { showToast('Informe o nome do colaborador.', 'error'); return; }
  if (!state.tipo) { showToast('Selecione o cargo.', 'error'); return; }

  // inicializa checklist se vazio
  const itens = ACESSOS[state.tipo];
  itens.forEach(item => {
    if (!state.checklist[item.id]) {
      state.checklist[item.id] = { done: false, by: '', at: '' };
    }
  });

  renderChecklist();
  document.getElementById('s2-title').textContent = `Checklist — ${capitalize(state.tipo)}`;
  goStep(2);
}

// ─────────────────────────────────────────────
// STEP 2 — CHECKLIST
// ─────────────────────────────────────────────
function renderChecklist() {
  const itens = ACESSOS[state.tipo] || [];
  const wrap  = document.getElementById('s2-checklist');
  wrap.innerHTML = '';

  itens.forEach(item => {
    const st = state.checklist[item.id] || { done: false, by: '', at: '' };
    const div = document.createElement('div');
    div.className = 'check-item' + (st.done ? ' checked' : '');
    div.id = `ci-${item.id}`;

    const currentResp = document.getElementById('s2-resp')?.value || '';
    const isOther = st.done && st.by && st.by !== currentResp;
    if (isOther) div.classList.add('checked-other');

    div.innerHTML = `
      <div class="check-box">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0f11" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="check-text">
        <div class="check-name">${item.nome}</div>
        <div class="check-meta">${item.categoria}${st.done && st.at ? ' · ' + fmtDate(st.at) : ''}</div>
      </div>
      ${st.done && st.by ? `<span class="check-by">${st.by}</span>` : ''}
    `;

    div.addEventListener('click', () => toggleItem(item.id));
    wrap.appendChild(div);
  });

  updateProgress();
  updateCollabBanner();
}

function toggleItem(id) {
  const resp = document.getElementById('s2-resp')?.value;
  if (!resp) { showToast('Selecione seu nome antes de marcar itens.', 'error'); return; }

  const st = state.checklist[id];
  st.done = !st.done;
  st.by   = st.done ? resp : '';
  st.at   = st.done ? new Date().toISOString() : '';

  // re-render item
  const item = ACESSOS[state.tipo].find(i => i.id === id);
  const div  = document.getElementById(`ci-${id}`);
  if (!div) return;

  div.className = 'check-item' + (st.done ? ' checked' : '');
  div.innerHTML = `
    <div class="check-box">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0f11" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="check-text">
      <div class="check-name">${item.nome}</div>
      <div class="check-meta">${item.categoria}${st.done && st.at ? ' · ' + fmtDate(st.at) : ''}</div>
    </div>
    ${st.done && st.by ? `<span class="check-by">${st.by}</span>` : ''}
  `;

  div.addEventListener('click', () => toggleItem(id));
  updateProgress();
  saveDraft();
}

function updateProgress() {
  const itens = ACESSOS[state.tipo] || [];
  const total = itens.length;
  const done  = itens.filter(i => state.checklist[i.id]?.done).length;
  const pct   = total ? (done / total * 100) : 0;

  document.getElementById('s2-prog-fill').style.width = pct + '%';
  document.getElementById('s2-prog-label').textContent = `${done} / ${total}`;
}

function updateCollabBanner() {
  const itens = ACESSOS[state.tipo] || [];
  const byOthers = itens.filter(i => {
    const s = state.checklist[i.id];
    const myResp = document.getElementById('s2-resp')?.value;
    return s?.done && s.by && s.by !== myResp;
  });

  const banner = document.getElementById('collab-banner');
  const text   = document.getElementById('collab-text');

  if (byOthers.length > 0) {
    text.textContent = `${byOthers.length} item(s) marcados por outros colaboradores.`;
    banner.style.display = 'flex';
  } else {
    text.textContent = 'Nenhum item marcado por outros ainda.';
    banner.style.display = 'flex';
  }
}

function saveStep2() {
  state.s2Resp = document.getElementById('s2-resp')?.value || '';
  saveDraft();
  renderReview();
  goStep(3);
}

// listener para re-render ao mudar responsável
document.addEventListener('change', e => {
  if (e.target.id === 's2-resp') {
    renderChecklist();
  }
});

// ─────────────────────────────────────────────
// STEP 3 — REVISÃO
// ─────────────────────────────────────────────
function renderReview() {
  const itens    = ACESSOS[state.tipo] || [];
  const content  = document.getElementById('s3-content');
  const pendBox  = document.getElementById('s3-pending');
  const pendList = document.getElementById('s3-pending-list');

  // agrupa por categoria
  const cats = {};
  itens.forEach(item => {
    const st = state.checklist[item.id];
    if (!cats[item.categoria]) cats[item.categoria] = [];
    cats[item.categoria].push({ ...item, st });
  });

  let html = '';
  Object.entries(cats).forEach(([cat, list]) => {
    html += `<div class="review-group">
      <div class="review-group-title">${cat}</div>`;
    list.forEach(item => {
      const done = item.st?.done;
      html += `<div class="review-item">
        <div class="review-dot ${done ? 'green' : 'gray'}"></div>
        <span class="review-name">${item.nome}</span>
        <span class="review-by">${done ? (item.st.by || '—') : 'pendente'}</span>
      </div>`;
    });
    html += '</div>';
  });

  content.innerHTML = html;

  // pendentes
  const pending = itens.filter(i => !state.checklist[i.id]?.done);
  if (pending.length > 0) {
    pendList.innerHTML = pending.map(p =>
      `<div class="pending-item">${p.nome}</div>`
    ).join('');
    pendBox.style.display = 'block';
  } else {
    pendBox.style.display = 'none';
  }
}

// ─────────────────────────────────────────────
// STEP 4 — ENVIO DP
// ─────────────────────────────────────────────
function toggleDP() {
  state.dpEnviado = !state.dpEnviado;
  const btn  = document.getElementById('dp-toggle');
  const text = document.getElementById('dp-status-text');
  const row  = document.getElementById('dp-date-row');

  btn.classList.toggle('on', state.dpEnviado);
  text.textContent = state.dpEnviado ? 'Enviado ✓' : 'Aguardando confirmação';
  row.style.display = state.dpEnviado ? 'flex' : 'none';

  if (state.dpEnviado && !document.getElementById('s4-dp-data').value) {
    document.getElementById('s4-dp-data').value = todayISO();
  }
}

// ─────────────────────────────────────────────
// FINALIZAR
// ─────────────────────────────────────────────
function finalize() {
  state.revisadoPor = document.getElementById('s3-resp')?.value || '';
  state.enviadoPor  = document.getElementById('s4-resp')?.value || '';
  state.dpData      = document.getElementById('s4-dp-data')?.value || '';
  state.dpObs       = document.getElementById('s4-dp-obs')?.value || '';

  const itens   = ACESSOS[state.tipo] || [];
  const total   = itens.length;
  const done    = itens.filter(i => state.checklist[i.id]?.done).length;

  const record = {
    id:          generateId(),
    criadoEm:   new Date().toISOString(),
    nome:        state.nome,
    tipo:        state.tipo,
    data:        state.data,
    motivo:      state.motivo,
    checklist:   { ...state.checklist },
    total,
    done,
    dpEnviado:   state.dpEnviado,
    dpData:      state.dpData,
    dpObs:       state.dpObs,
    revisadoPor: state.revisadoPor,
    enviadoPor:  state.enviadoPor,
    s2Resp:      state.s2Resp,
  };

  if (currentRecordId) {
    const idx = records.findIndex(r => r.id === currentRecordId);
    if (idx >= 0) records[idx] = record;
    else records.unshift(record);
  } else {
    records.unshift(record);
  }

  saveRecords();
  localStorage.removeItem('pv_draft');

  showLoader('Salvando registro...');
  setTimeout(() => {
    hideLoader();
    showToast('Registro finalizado com sucesso!', 'success');
    resetState();
    goPanel();
  }, 900);
}

function resetState() {
  state = {
    step: 1, tipo: null, nome: '', data: '', motivo: '',
    checklist: {}, dpEnviado: false, dpData: '', dpObs: '',
    revisadoPor: '', enviadoPor: '', s2Resp: '',
  };
  currentRecordId = null;

  document.getElementById('s1-nome').value   = '';
  document.getElementById('s1-data').value   = todayISO();
  document.getElementById('s1-motivo').value = '';
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('dp-toggle').classList.remove('on');
  document.getElementById('dp-status-text').textContent = 'Aguardando confirmação';
  document.getElementById('dp-date-row').style.display  = 'none';

  updateStepBar(1);
  showStep(1);
}

// ─────────────────────────────────────────────
// PAINEL
// ─────────────────────────────────────────────
function goPanel() {
  document.getElementById('view-wizard').classList.add('hidden');
  document.getElementById('view-panel').classList.remove('hidden');
  renderPanel();
}

function goNew() {
  document.getElementById('view-panel').classList.add('hidden');
  document.getElementById('view-wizard').classList.remove('hidden');
  resetState();
}

function renderPanel() {
  renderStats();
  renderRecordList();
}

function renderStats() {
  const total    = records.length;
  const finalizados = records.filter(r => r.done === r.total).length;
  const parciais    = records.filter(r => r.done > 0 && r.done < r.total).length;
  const pendentes   = records.filter(r => r.done === 0).length;

  document.getElementById('panel-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-val">${total}</div>
      <div class="stat-label">Total de registros</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:var(--green)">${finalizados}</div>
      <div class="stat-label">Concluídos</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:var(--orange)">${parciais}</div>
      <div class="stat-label">Parciais</div>
    </div>
    <div class="stat-card">
      <div class="stat-val" style="color:var(--red)">${pendentes}</div>
      <div class="stat-label">Pendentes</div>
    </div>
  `;
}

function renderRecordList() {
  const list = document.getElementById('panel-list');
  if (!records.length) {
    list.innerHTML = `
      <div class="panel-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
        <div>Nenhum registro ainda.</div>
      </div>`;
    return;
  }

  list.innerHTML = records.map(r => {
    const pct = r.total ? Math.round(r.done / r.total * 100) : 0;
    let statusClass, statusLabel;
    if (pct === 100)  { statusClass = 'status-done';    statusLabel = 'Concluído'; }
    else if (pct > 0) { statusClass = 'status-partial'; statusLabel = `${pct}%`; }
    else              { statusClass = 'status-pending';  statusLabel = 'Pendente'; }

    return `
      <div class="record-row" onclick="openModal('${r.id}')">
        <span class="record-badge badge-${r.tipo}">${capitalize(r.tipo)}</span>
        <span class="record-name">${r.nome}</span>
        <div class="record-prog"><div class="record-prog-fill" style="width:${pct}%"></div></div>
        <span class="record-meta">${r.motivo || '—'} · ${fmtDateShort(r.data)}</span>
        <span class="record-status ${statusClass}">${statusLabel}</span>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
// MODAL DETALHE
// ─────────────────────────────────────────────
function openModal(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;

  document.getElementById('modal-title').textContent = r.nome;

  const itens = ACESSOS[r.tipo] || [];
  const cats  = {};
  itens.forEach(item => {
    if (!cats[item.categoria]) cats[item.categoria] = [];
    cats[item.categoria].push({ ...item, st: r.checklist[item.id] });
  });

  let html = `
    <div class="modal-meta">
      <div class="modal-field">
        <div class="modal-field-label">Cargo</div>
        <div class="modal-field-val">${capitalize(r.tipo)}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Motivo</div>
        <div class="modal-field-val">${r.motivo || '—'}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Data</div>
        <div class="modal-field-val">${fmtDateShort(r.data)}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Progresso</div>
        <div class="modal-field-val">${r.done} / ${r.total} itens</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Revisado por</div>
        <div class="modal-field-val">${r.revisadoPor || '—'}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">DP enviado</div>
        <div class="modal-field-val">${r.dpEnviado ? '✓ Sim' : 'Não'}</div>
      </div>
    </div>
  `;

  Object.entries(cats).forEach(([cat, list]) => {
    html += `<div class="modal-section-title">${cat}</div>`;
    list.forEach(item => {
      const done = item.st?.done;
      html += `<div class="modal-check-item">
        <div class="modal-dot" style="background:${done ? 'var(--green)' : 'var(--text3)'}"></div>
        <span style="flex:1;color:var(--text)">${item.nome}</span>
        <span style="font-family:var(--font-mono);font-size:.7rem;color:var(--text3)">${done ? (item.st.by || '—') : 'pendente'}</span>
      </div>`;
    });
  });

  html += `
    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-export" onclick="exportSingleXLSX('${r.id}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar .xlsx
      </button>
      <button class="btn-ghost" onclick="editRecord('${r.id}')">
        ✎ Editar
      </button>
      <button class="btn-ghost" style="color:var(--red);border-color:rgba(255,92,92,.3)" onclick="deleteRecord('${r.id}')">
        ✕ Excluir
      </button>
    </div>
  `;

  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function editRecord(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  closeModal();

  // carrega dados no wizard
  state = {
    step:       1,
    tipo:       r.tipo,
    nome:       r.nome,
    data:       r.data,
    motivo:     r.motivo,
    checklist:  { ...r.checklist },
    dpEnviado:  r.dpEnviado,
    dpData:     r.dpData,
    dpObs:      r.dpObs,
    revisadoPor: r.revisadoPor,
    enviadoPor:  r.enviadoPor,
    s2Resp:     r.s2Resp,
  };
  currentRecordId = id;

  document.getElementById('s1-nome').value   = state.nome;
  document.getElementById('s1-data').value   = state.data;
  document.getElementById('s1-motivo').value = state.motivo;
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById(`tc-${state.tipo}`)?.classList.add('selected');

  document.getElementById('view-panel').classList.add('hidden');
  document.getElementById('view-wizard').classList.remove('hidden');
  goStep(1);
}

function deleteRecord(id) {
  if (!confirm('Excluir este registro permanentemente?')) return;
  records = records.filter(r => r.id !== id);
  saveRecords();
  closeModal();
  renderPanel();
  showToast('Registro excluído.', 'success');
}

// ─────────────────────────────────────────────
// EXPORT XLSX
// ─────────────────────────────────────────────
function buildXLSXData(r) {
  const itens = ACESSOS[r.tipo] || [];
  const rows  = [
    ['Colaborador', r.nome],
    ['Cargo',       capitalize(r.tipo)],
    ['Data',        fmtDateShort(r.data)],
    ['Motivo',      r.motivo || '—'],
    ['DP Enviado',  r.dpEnviado ? 'Sim' : 'Não'],
    ['Data DP',     r.dpData || '—'],
    ['Obs. DP',     r.dpObs || '—'],
    ['Revisado por', r.revisadoPor || '—'],
    ['Enviado por',  r.enviadoPor || '—'],
    [],
    ['Categoria', 'Acesso', 'Status', 'Responsável', 'Data/hora'],
  ];

  itens.forEach(item => {
    const st = r.checklist[item.id];
    rows.push([
      item.categoria,
      item.nome,
      st?.done ? 'Concluído' : 'Pendente',
      st?.by   || '—',
      st?.at   ? fmtDate(st.at) : '—',
    ]);
  });

  return rows;
}

function exportXLSX() {
  state.dpData = document.getElementById('s4-dp-data')?.value || '';
  state.dpObs  = document.getElementById('s4-dp-obs')?.value  || '';
  state.revisadoPor = document.getElementById('s3-resp')?.value || '';
  state.enviadoPor  = document.getElementById('s4-resp')?.value || '';

  const r = {
    ...state,
    id: currentRecordId || generateId(),
    tipo: state.tipo,
    total: (ACESSOS[state.tipo] || []).length,
    done:  (ACESSOS[state.tipo] || []).filter(i => state.checklist[i.id]?.done).length,
  };

  doExport([r], `PV_${slugify(state.nome)}_${todayISO()}.xlsx`);
}

function exportSingleXLSX(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  doExport([r], `PV_${slugify(r.nome)}_${todayISO()}.xlsx`);
}

function exportAllXLSX() {
  if (!records.length) { showToast('Nenhum registro para exportar.', 'error'); return; }
  doExport(records, `PV_Todos_${todayISO()}.xlsx`);
}

function doExport(recs, filename) {
  if (typeof XLSX === 'undefined') { showToast('Biblioteca XLSX não carregada.', 'error'); return; }
  showLoader('Gerando planilha...');

  setTimeout(() => {
    try {
      const wb = XLSX.utils.book_new();

      recs.forEach((r, idx) => {
        const data = buildXLSXData(r);
        const ws   = XLSX.utils.aoa_to_sheet(data);

        // larguras
        ws['!cols'] = [
          { wch: 18 }, { wch: 32 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
        ];

        const sheetName = slugify(r.nome).slice(0, 30) || `Reg${idx + 1}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, filename);
      hideLoader();
      showToast('Arquivo exportado!', 'success');
    } catch (e) {
      hideLoader();
      showToast('Erro ao gerar planilha.', 'error');
      console.error(e);
    }
  }, 600);
}

// ─────────────────────────────────────────────
// LOADER / TOAST
// ─────────────────────────────────────────────
function showLoader(text = 'Aguarde...') {
  document.getElementById('loader-text').textContent = text;
  document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast${type ? ' ' + type : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 2800);
}

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function slugify(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .slice(0, 28);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
