/* ═══════════════════════════════════════════
   PORTO VALE — Encerramento de Acessos
   app.js
═══════════════════════════════════════════ */

'use strict';

// ══ DADOS DE ACESSOS ══════════════════════════════

const ACESSOS = {
  gerente: [
    { id: 'g1',  nome: 'E-mail corporativo',     desc: 'Revogar acesso e desativar conta' },
    { id: 'g2',  nome: 'Sistema ERP',             desc: 'Desativar usuário no sistema' },
    { id: 'g3',  nome: 'CRM',                     desc: 'Remover perfil de vendas/gerência' },
    { id: 'g4',  nome: 'VPN corporativa',         desc: 'Revogar certificado e credenciais' },
    { id: 'g5',  nome: 'Slack / Teams',           desc: 'Remover de todos os canais e workspace' },
    { id: 'g6',  nome: 'Google Workspace / M365', desc: 'Suspender conta e transferir dados' },
    { id: 'g7',  nome: 'Painel financeiro',       desc: 'Revogar permissões de consulta' },
    { id: 'g8',  nome: 'Repositório de código',   desc: 'Remover do GitHub/GitLab/Bitbucket' },
    { id: 'g9',  nome: 'AWS / GCP / Azure',       desc: 'Revogar IAM e chaves de acesso' },
    { id: 'g10', nome: 'Plataforma de BI',        desc: 'Desativar usuário e revogar relatórios' },
    { id: 'g11', nome: 'Crachá / Acesso físico',  desc: 'Recolher crachá e bloquear biometria' },
    { id: 'g12', nome: 'Equipamentos',            desc: 'Recolher notebook, celular e periféricos' },
    { id: 'g13', nome: 'Assinaturas digitais',    desc: 'Revogar certificado A1/A3 e tokens' },
    { id: 'g14', nome: 'Grupos de distribuição',  desc: 'Remover de listas de e-mail e grupos' },
  ],
  vendedor: [
    { id: 'v1', nome: 'E-mail corporativo',   desc: 'Revogar acesso e desativar conta' },
    { id: 'v2', nome: 'CRM',                  desc: 'Remover perfil e transferir carteira' },
    { id: 'v3', nome: 'Slack / Teams',        desc: 'Remover de canais e workspace' },
    { id: 'v4', nome: 'Crachá / Acesso físico', desc: 'Recolher crachá e bloquear biometria' },
    { id: 'v5', nome: 'Equipamentos',         desc: 'Recolher celular funcional e materiais' },
  ],
};

const RESPONSAVEIS = [
  'Ana Lima',
  'Carlos Mota',
  'Fernanda Souza',
  'Rafael Torres',
  'Juliana Prado',
  'Marcos Oliveira',
];

// ══ ESTADO ════════════════════════════════════════

let state = {
  step: 1,
  tipo: null,         // 'gerente' | 'vendedor'
  nome: '',
  data: '',
  motivo: '',
  checks: {},         // { id: { done: bool, who: string, ts: number } }
  resp: {
    s2: '', s3: '', s4: '',
  },
  dpEnviado: false,
  dpData: '',
  dpObs: '',
  finalizado: false,
};

// ══ STORAGE ═══════════════════════════════════════

const STORAGE_KEY = 'portovale_checklist_v2';
const RECORDS_KEY = 'portovale_records_v2';

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch (e) {}
}

function getRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); } catch (e) { return []; }
}

function saveRecord(rec) {
  const records = getRecords();
  const idx = records.findIndex(r => r.id === rec.id);
  if (idx >= 0) records[idx] = rec;
  else records.unshift(rec);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

// ══ UTILS ═════════════════════════════════════════

function fmt(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.remove('hidden');
  clearTimeout(t._to);
  t._to = setTimeout(() => t.classList.add('hidden'), 3000);
}

function showLoader(msg = 'Salvando...') {
  document.getElementById('loader-text').textContent = msg;
  document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

function populateRespSelect(id) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Selecione seu nome</option>';
  RESPONSAVEIS.forEach(r => {
    const o = document.createElement('option');
    o.value = r; o.textContent = r;
    if (r === cur) o.selected = true;
    sel.appendChild(o);
  });
}

// ══ VIEWS ═════════════════════════════════════════

function showView(id) {
  document.getElementById('view-wizard').classList.toggle('hidden', id !== 'wizard');
  document.getElementById('view-panel').classList.toggle('hidden', id !== 'panel');
}

function goPanel() {
  showView('panel');
  renderPanel();
}

function goNew() {
  // Reset state for new entry
  state = {
    step: 1, tipo: null, nome: '', data: '', motivo: '',
    checks: {}, resp: { s2: '', s3: '', s4: '' },
    dpEnviado: false, dpData: '', dpObs: '', finalizado: false,
  };
  saveState();
  showView('wizard');
  goStep(1);
}

// ══ WIZARD NAVIGATION ═════════════════════════════

function updateStepIndicator(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById('si-' + i);
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    else if (i === n) el.classList.add('active');
  }
}

function goStep(n) {
  // Hide all steps
  document.querySelectorAll('.step-view').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('step-' + n);
  if (target) {
    target.classList.add('active');
    // Force reflow for animation
    void target.offsetWidth;
  }
  state.step = n;
  updateStepIndicator(n);
  saveState();

  if (n === 2) renderStep2();
  if (n === 3) renderStep3();
  if (n === 4) renderStep4();
}

// ══ STEP 1 ════════════════════════════════════════

function selectTipo(tipo) {
  state.tipo = tipo;
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('tc-' + tipo).classList.add('selected');
}

function goStep2() {
  const nome = document.getElementById('s1-nome').value.trim();
  const data = document.getElementById('s1-data').value;
  const motivo = document.getElementById('s1-motivo').value;

  if (!nome) { showToast('Informe o nome do colaborador.', 'error'); return; }
  if (!state.tipo) { showToast('Selecione o tipo de cargo.', 'error'); return; }

  state.nome = nome;
  state.data = data;
  state.motivo = motivo;

  // Init checks if empty
  const acessos = ACESSOS[state.tipo];
  acessos.forEach(a => {
    if (!state.checks[a.id]) state.checks[a.id] = { done: false, who: '', ts: null };
  });

  saveState();
  goStep(2);
}

// ══ STEP 2 ════════════════════════════════════════

function renderStep2() {
  const acessos = ACESSOS[state.tipo] || [];

  document.getElementById('s2-title').textContent =
    `Checklist — ${state.tipo === 'gerente' ? 'Gerente' : 'Vendedor'}`;

  populateRespSelect('s2-resp');
  document.getElementById('s2-resp').value = state.resp.s2 || '';

  const resp = state.resp.s2;
  const done = acessos.filter(a => state.checks[a.id]?.done).length;

  // Collab banner
  document.getElementById('collab-text').textContent =
    done > 0
      ? `${done} de ${acessos.length} acessos já encerrados`
      : `Nenhum acesso encerrado ainda — seja o primeiro!`;

  // Checklist
  const wrap = document.getElementById('s2-checklist');
  wrap.innerHTML = '';
  acessos.forEach(a => {
    const c = state.checks[a.id] || {};
    const isMine = c.done && c.who === resp;
    const isOther = c.done && c.who !== resp;

    const div = document.createElement('div');
    div.className = 'checklist-item' +
      (isMine ? ' checked' : '') +
      (isOther ? ' checked-other' : '');
    div.onclick = () => toggleCheck(a.id);

    div.innerHTML = `
      <div class="ci-check">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="ci-info">
        <div class="ci-name">${a.nome}</div>
        <div class="ci-desc">${a.desc}</div>
        ${c.done ? `<div class="ci-by">✓ ${c.who || 'Anônimo'}</div>` : ''}
      </div>
    `;
    wrap.appendChild(div);
  });

  updateProgress();
}

function toggleCheck(id) {
  const resp = document.getElementById('s2-resp').value;
  if (!resp) { showToast('Selecione seu nome antes de marcar.', 'error'); return; }

  state.resp.s2 = resp;
  const c = state.checks[id];
  if (c.done && c.who !== resp) {
    // Allow unchecking only if same person
    showToast(`Este item foi marcado por ${c.who}.`, 'error');
    return;
  }

  c.done = !c.done;
  c.who = c.done ? resp : '';
  c.ts = c.done ? Date.now() : null;

  saveState();
  renderStep2();
}

function updateProgress() {
  const acessos = ACESSOS[state.tipo] || [];
  const total = acessos.length;
  const done = acessos.filter(a => state.checks[a.id]?.done).length;
  const p = pct(done, total);

  document.getElementById('s2-prog-fill').style.width = p + '%';
  document.getElementById('s2-prog-label').textContent = `${done} / ${total}`;
}

function saveStep2() {
  const resp = document.getElementById('s2-resp').value;
  state.resp.s2 = resp;
  showLoader('Salvando checklist...');
  setTimeout(() => {
    saveState();
    hideLoader();
    showToast('Checklist salvo!', 'success');
    goStep(3);
  }, 600);
}

// ══ STEP 3 ════════════════════════════════════════

function renderStep3() {
  const acessos = ACESSOS[state.tipo] || [];
  populateRespSelect('s3-resp');
  document.getElementById('s3-resp').value = state.resp.s3 || '';

  const done = acessos.filter(a => state.checks[a.id]?.done);
  const pending = acessos.filter(a => !state.checks[a.id]?.done);

  const content = document.getElementById('s3-content');
  if (done.length === 0) {
    content.innerHTML = `<p style="color:var(--text3);font-size:.85rem;padding:16px 0;">Nenhum acesso foi encerrado ainda.</p>`;
  } else {
    content.innerHTML = `
      <div class="review-group">
        <div class="review-group-title">Acessos encerrados (${done.length})</div>
        ${done.map(a => {
          const c = state.checks[a.id];
          return `<div class="review-item">
            <div class="ri-dot"></div>
            <span class="ri-name">${a.nome}</span>
            <span class="ri-who">${c.who || '—'}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  const pendingBox = document.getElementById('s3-pending');
  if (pending.length > 0) {
    pendingBox.style.display = '';
    document.getElementById('s3-pending-list').innerHTML =
      pending.map(a => `<div class="pending-item">${a.nome}</div>`).join('');
  } else {
    pendingBox.style.display = 'none';
  }
}

// ══ STEP 4 ════════════════════════════════════════

function renderStep4() {
  populateRespSelect('s4-resp');
  document.getElementById('s4-resp').value = state.resp.s4 || '';

  // Restore DP toggle state
  const btn = document.getElementById('dp-toggle');
  if (state.dpEnviado) {
    btn.classList.add('on');
    document.getElementById('dp-status-text').textContent = 'Enviado ✓';
    document.getElementById('dp-date-row').style.display = '';
  } else {
    btn.classList.remove('on');
    document.getElementById('dp-status-text').textContent = 'Aguardando confirmação';
    document.getElementById('dp-date-row').style.display = 'none';
  }

  if (state.dpData) document.getElementById('s4-dp-data').value = state.dpData;
  if (state.dpObs)  document.getElementById('s4-dp-obs').value  = state.dpObs;
}

function toggleDP() {
  state.dpEnviado = !state.dpEnviado;
  const btn = document.getElementById('dp-toggle');
  btn.classList.toggle('on', state.dpEnviado);
  document.getElementById('dp-status-text').textContent =
    state.dpEnviado ? 'Enviado ✓' : 'Aguardando confirmação';
  document.getElementById('dp-date-row').style.display =
    state.dpEnviado ? '' : 'none';

  state.resp.s4 = document.getElementById('s4-resp').value;
  saveState();
}

// ══ FINALIZE ══════════════════════════════════════

function finalize() {
  const resp = document.getElementById('s4-resp').value;
  state.resp.s4 = resp;
  state.dpData = document.getElementById('s4-dp-data').value;
  state.dpObs  = document.getElementById('s4-dp-obs').value;
  state.finalizado = true;

  const acessos = ACESSOS[state.tipo] || [];
  const doneCnt = acessos.filter(a => state.checks[a.id]?.done).length;

  const record = {
    id: 'rec_' + Date.now(),
    nome: state.nome,
    tipo: state.tipo,
    data: state.data,
    motivo: state.motivo,
    checks: { ...state.checks },
    resp: { ...state.resp },
    dpEnviado: state.dpEnviado,
    dpData: state.dpData,
    dpObs: state.dpObs,
    total: acessos.length,
    done: doneCnt,
    criadoEm: new Date().toISOString(),
  };

  showLoader('Finalizando registro...');
  setTimeout(() => {
    saveRecord(record);
    // Clear current draft
    localStorage.removeItem(STORAGE_KEY);
    hideLoader();
    showToast('Registro finalizado com sucesso!', 'success');
    setTimeout(() => goPanel(), 1000);
  }, 800);
}

// ══ EXPORT XLSX ═══════════════════════════════════

function buildSheetData(record) {
  const acessos = ACESSOS[record.tipo] || [];
  const rows = [
    ['PORTO VALE — Encerramento de Acessos'],
    [],
    ['Nome',    record.nome],
    ['Cargo',   record.tipo === 'gerente' ? 'Gerente' : 'Vendedor'],
    ['Data',    fmt(record.data)],
    ['Motivo',  record.motivo],
    ['DP Enviado', record.dpEnviado ? 'Sim' : 'Não'],
    ['Data DP', fmt(record.dpData)],
    ['Observação', record.dpObs || '—'],
    [],
    ['Acesso', 'Status', 'Responsável'],
    ...acessos.map(a => {
      const c = record.checks[a.id] || {};
      return [a.nome, c.done ? 'Encerrado' : 'Pendente', c.who || '—'];
    }),
  ];
  return rows;
}

function exportXLSX() {
  const acessos = ACESSOS[state.tipo] || [];
  if (!state.nome) { showToast('Preencha os dados antes de exportar.', 'error'); return; }

  const record = {
    nome: state.nome, tipo: state.tipo, data: state.data,
    motivo: state.motivo, checks: state.checks,
    dpEnviado: state.dpEnviado, dpData: state.dpData, dpObs: state.dpObs,
    total: acessos.length,
    done: acessos.filter(a => state.checks[a.id]?.done).length,
  };

  const ws = XLSX.utils.aoa_to_sheet(buildSheetData(record));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Checklist');
  XLSX.writeFile(wb, `checklist_${state.nome.replace(/\s/g,'_')}.xlsx`);
  showToast('Arquivo exportado!', 'success');
}

function exportAllXLSX() {
  const records = getRecords();
  if (!records.length) { showToast('Nenhum registro encontrado.', 'error'); return; }

  const wb = XLSX.utils.book_new();
  records.forEach((r, i) => {
    const ws = XLSX.utils.aoa_to_sheet(buildSheetData(r));
    XLSX.utils.book_append_sheet(wb, ws, `${i+1}_${r.nome.slice(0,20).replace(/\s/g,'_')}`);
  });

  // Summary sheet
  const summary = [
    ['Nome', 'Cargo', 'Data', 'Motivo', 'Acessos OK', 'Total', '%', 'DP Enviado'],
    ...records.map(r => [
      r.nome,
      r.tipo === 'gerente' ? 'Gerente' : 'Vendedor',
      fmt(r.data), r.motivo,
      r.done, r.total,
      pct(r.done, r.total) + '%',
      r.dpEnviado ? 'Sim' : 'Não',
    ]),
  ];
  const wsSum = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSum, 'Resumo');

  XLSX.writeFile(wb, `porto_vale_acessos_${new Date().toISOString().slice(0,10)}.xlsx`);
  showToast('Exportação completa!', 'success');
}

// ══ PAINEL ════════════════════════════════════════

function renderPanel() {
  const records = getRecords();

  // Stats
  const total = records.length;
  const completos = records.filter(r => r.done === r.total).length;
  const dpEnviados = records.filter(r => r.dpEnviado).length;

  document.getElementById('panel-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${total}</div>
      <div class="stat-label">Registros</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${completos}</div>
      <div class="stat-label">Completos</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${dpEnviados}</div>
      <div class="stat-label">Enviados ao DP</div>
    </div>
  `;

  // List
  const list = document.getElementById('panel-list');
  if (!records.length) {
    list.innerHTML = '<div class="panel-empty">Nenhum registro ainda. Clique em "Novo" para começar.</div>';
    return;
  }

  list.innerHTML = records.map(r => {
    const p = pct(r.done, r.total);
    const emoji = r.tipo === 'gerente' ? '👔' : '🤝';
    let badgeClass = p === 100 ? 'badge-green' : p > 0 ? 'badge-yellow' : 'badge-gray';
    let badgeLabel = p === 100 ? 'Completo' : p > 0 ? `${p}%` : 'Pendente';

    return `
      <div class="record-card" onclick="openModal('${r.id}')">
        <div class="rc-tipo">${emoji}</div>
        <div class="rc-info">
          <div class="rc-name">${r.nome}</div>
          <div class="rc-meta">
            <span>${r.tipo === 'gerente' ? 'Gerente' : 'Vendedor'}</span>
            ${r.data ? `<span>📅 ${fmt(r.data)}</span>` : ''}
            ${r.motivo ? `<span>${r.motivo}</span>` : ''}
          </div>
        </div>
        <div class="rc-badges">
          ${r.dpEnviado ? '<span class="badge badge-blue">DP ✓</span>' : ''}
          <span class="badge ${badgeClass}">${badgeLabel}</span>
          <div class="rc-prog">
            <div class="rc-prog-bar">
              <div class="rc-prog-fill" style="width:${p}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openModal(id) {
  const records = getRecords();
  const r = records.find(rec => rec.id === id);
  if (!r) return;

  const acessos = ACESSOS[r.tipo] || [];
  document.getElementById('modal-title').textContent = r.nome;

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Dados gerais</div>
      <div class="modal-field"><span class="modal-field-key">Cargo</span><span class="modal-field-val">${r.tipo === 'gerente' ? 'Gerente' : 'Vendedor'}</span></div>
      <div class="modal-field"><span class="modal-field-key">Data</span><span class="modal-field-val">${fmt(r.data)}</span></div>
      <div class="modal-field"><span class="modal-field-key">Motivo</span><span class="modal-field-val">${r.motivo || '—'}</span></div>
      <div class="modal-field"><span class="modal-field-key">DP Enviado</span><span class="modal-field-val">${r.dpEnviado ? '✓ Sim' : '✗ Não'}</span></div>
      ${r.dpData ? `<div class="modal-field"><span class="modal-field-key">Data DP</span><span class="modal-field-val">${fmt(r.dpData)}</span></div>` : ''}
      ${r.dpObs  ? `<div class="modal-field"><span class="modal-field-key">Observação</span><span class="modal-field-val">${r.dpObs}</span></div>` : ''}
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Acessos (${r.done}/${r.total})</div>
      ${acessos.map(a => {
        const c = r.checks?.[a.id] || {};
        return `<div class="modal-check">
          <div class="modal-check-dot" style="background:${c.done ? 'var(--green)' : 'var(--border2)'}"></div>
          <span style="flex:1;font-size:.82rem;">${a.nome}</span>
          ${c.done ? `<span style="font-family:var(--mono);font-size:.68rem;color:var(--text3)">${c.who || '—'}</span>` : ''}
        </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ══ INIT ══════════════════════════════════════════

function init() {
  loadState();

  // Restore step 1 fields
  if (state.nome) document.getElementById('s1-nome').value = state.nome;
  if (state.data) document.getElementById('s1-data').value = state.data;
  if (state.motivo) document.getElementById('s1-motivo').value = state.motivo;
  if (state.tipo) selectTipo(state.tipo);

  // Set today as default date if empty
  if (!state.data) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('s1-data').value = today;
  }

  // Populate selects
  populateRespSelect('s2-resp');
  populateRespSelect('s3-resp');
  populateRespSelect('s4-resp');

  // Show wizard and go to saved step
  showView('wizard');
  goStep(state.step || 1);

  // Update step indicator
  updateStepIndicator(state.step || 1);
}

document.addEventListener('DOMContentLoaded', init);
