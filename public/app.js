// ==================== VARIÁVEIS GLOBAIS ====================
let tarefas = [];
let tarefasFiltradas = [];
let atrasos = [];
let adiantadas = [];
let chartStatus, chartTipo, chartTaxaConclusao;
let sortConfig = { key: null, direction: 'none' };
let sortConfigAtraso = { key: 'DiasAtraso', direction: 'desc' };
let sortConfigAdiantadas = { key: 'TempoOtimizado', direction: 'desc' };

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const API_BASE_URL = window.location.origin;

// ==================== FUNÇÕES DE API ====================

/**
 * Carrega dados da API Projuris
 */
async function carregarDadosDaAPI() {
  try {
    mostrarLoading(true, 'Conectando com API Projuris...');
    mostrarMensagem('', '');
    atualizarStatusConexao('loading');

    const response = await fetch(`${API_BASE_URL}/api/tarefas`);

    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || 'Erro desconhecido ao buscar tarefas');
    }

    // Processa os dados recebidos
    tarefas = resultado.data.map(normalizarTarefa);

    if (tarefas.length === 0) {
      throw new Error('Nenhuma tarefa foi retornada pela API');
    }

    // Limpa filtros e processa
    limparFiltros();
    tarefasFiltradas = [...tarefas];
    atualizarFiltros();
    processarTarefas();

    mostrarMensagem('sucesso', `✓ Dados carregados com sucesso! ${tarefas.length} tarefas encontradas.`);
    atualizarStatusConexao('connected', tarefas.length);

  } catch (error) {
    console.error('Erro ao carregar dados da API:', error);
    mostrarMensagem('erro', `✗ ${error.message}`);
    atualizarStatusConexao('error');
  } finally {
    mostrarLoading(false);
  }
}

/**
 * Normaliza tarefa recebida da API
 */
function normalizarTarefa(tarefa) {
  return {
    Pasta: tarefa['Identificador do módulo'] || '',
    Identificador: tarefa['Identificador da tarefa'] || '',
    Responsaveis: tarefa['Responsáveis da tarefa'] || '',
    Tipo: tarefa['Tipo de tarefa'] || '',
    DataCriacao: parsearDataAPI(tarefa['Data de criação']),
    DataBase: parsearDataAPI(tarefa['Data base']),
    DataPrevista: parsearDataAPI(tarefa['Data prevista']),
    DataFatal: parsearDataAPI(tarefa['Data fatal']),
    DataConclusao: parsearDataAPI(tarefa['Data da conclusão']),
    Grupos: tarefa['Grupos de trabalho'] || '',
    Situacao: tarefa['Situação'] || ''
  };
}

/**
 * Parseia data vinda da API
 */
function parsearDataAPI(dataStr) {
  if (!dataStr) return '';

  try {
    // Se já estiver no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (dataStr.includes('/')) {
      const [dia, mes, ano] = dataStr.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Se já estiver no formato YYYY-MM-DD, retorna
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dataStr;
    }

    // Tenta criar objeto Date
    const date = new Date(dataStr);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// ==================== FUNÇÕES DE UI ====================

function mostrarLoading(mostrar, texto = 'Processando...') {
  const loading = document.getElementById('loadingIndicator');
  const loadingText = document.getElementById('loadingText');
  const btnIcon = document.getElementById('btnLoadIcon');

  if (mostrar) {
    loading.classList.remove('hidden');
    loadingText.textContent = texto;
    btnIcon.classList.add('fa-spin');
  } else {
    loading.classList.add('hidden');
    btnIcon.classList.remove('fa-spin');
  }
}

function mostrarMensagem(tipo, texto) {
  const errorDiv = document.getElementById('errorMessage');
  const successDiv = document.getElementById('successMessage');

  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');

  if (tipo === 'erro') {
    errorDiv.textContent = texto;
    errorDiv.classList.remove('hidden');
  } else if (tipo === 'sucesso') {
    successDiv.textContent = texto;
    successDiv.classList.remove('hidden');
  }
}

function atualizarStatusConexao(status, totalTarefas = 0) {
  const statusDiv = document.getElementById('statusConnection');

  const statusConfig = {
    loading: {
      html: '<i class="fas fa-circle text-yellow-500 mr-1 pulse"></i> Conectando...',
      class: 'text-yellow-600'
    },
    connected: {
      html: `<i class="fas fa-circle text-green-500 mr-1"></i> Conectado (${totalTarefas} tarefas)`,
      class: 'text-green-600'
    },
    error: {
      html: '<i class="fas fa-circle text-red-500 mr-1"></i> Erro na conexão',
      class: 'text-red-600'
    }
  };

  const config = statusConfig[status] || statusConfig.loading;
  statusDiv.innerHTML = `<span class="${config.class}">${config.html}</span>`;
}

function toggleSection(sectionId) {
  const content = document.getElementById(sectionId);
  const icon = document.getElementById(`${sectionId.replace('Content', '')}Icon`);
  content.classList.toggle('hidden');
  icon.classList.toggle('fa-chevron-up');
  icon.classList.toggle('fa-chevron-down');

  if (sectionId === 'tabelaContent' && !content.classList.contains('hidden')) {
    ordenarTarefas(tarefasFiltradas);
    renderizarTabelaCompleta(tarefasFiltradas);
    atualizarIconesOrdenacao();
  }
}

function toggleTabela() {
  const tabelaContainer = document.getElementById('tabelaContainer');
  tabelaContainer.classList.toggle('hidden');

  if (!tabelaContainer.classList.contains('hidden')) {
    document.getElementById('tabelaContent').classList.remove('hidden');
    document.getElementById('tabelaIcon').classList.remove('fa-chevron-down');
    document.getElementById('tabelaIcon').classList.add('fa-chevron-up');
    ordenarTarefas(tarefasFiltradas);
    renderizarTabelaCompleta(tarefasFiltradas);
    atualizarIconesOrdenacao();
  } else {
    document.getElementById('tabelaContent').classList.add('hidden');
    document.getElementById('tabelaIcon').classList.remove('fa-chevron-up');
    document.getElementById('tabelaIcon').classList.add('fa-chevron-down');
  }
}

// ==================== FUNÇÕES DE FILTROS ====================

function toggleSelecaoResponsaveis() {
  const checkboxes = document.querySelectorAll('input[name="responsavel"]');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; });
  aplicarFiltros();
}

function toggleSelecaoSituacoes() {
  const checkboxes = document.querySelectorAll('input[name="situacao"]');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; });
  aplicarFiltros();
}

function atualizarFiltros() {
  const responsaveisSet = new Set();
  const situacoesSet = new Set();

  tarefas.forEach(t => {
    if (t.Responsaveis) {
      t.Responsaveis.split(',').forEach(r => {
        const nome = r.trim();
        if (nome) responsaveisSet.add(nome);
      });
    }
    if (t.Situacao) {
      situacoesSet.add(t.Situacao.trim());
    }
  });

  const responsaveis = Array.from(responsaveisSet).sort();
  const situacoes = Array.from(situacoesSet).sort();
  const grupos = [...new Set(tarefas.map(t => t.Grupos).filter(Boolean))].sort();
  const todosTipos = [...new Set(tarefas.map(t => t.Tipo).filter(Boolean))];
  const tiposTarefa = todosTipos.filter(t => t.startsWith('#')).sort();
  const tiposRelacionada = todosTipos.filter(t => !t.startsWith('#')).sort();

  // Atualiza responsáveis
  const responsaveisContainer = document.getElementById('filtroResponsaveisContainer');
  responsaveisContainer.innerHTML = responsaveis.length > 0 ? responsaveis.map(r => `
    <label class="block hover:bg-gray-50 cursor-pointer p-2">
      <input type="checkbox" name="responsavel" value="${r}" class="checkbox-custom" onchange="aplicarFiltros()">
      <span class="text-sm">${r}</span>
    </label>
  `).join('') : '<p class="p-4 text-gray-500 text-sm">Nenhum responsável encontrado</p>';

  // Atualiza situações
  const situacaoContainer = document.getElementById('filtroSituacaoContainer');
  situacaoContainer.innerHTML = situacoes.length > 0 ? situacoes.map(s => `
    <label class="block hover:bg-gray-50 cursor-pointer p-2">
      <input type="checkbox" name="situacao" value="${s}" class="checkbox-custom" onchange="aplicarFiltros()">
      <span class="text-sm">${s}</span>
    </label>
  `).join('') : '<p class="p-4 text-gray-500 text-sm">Nenhuma situação encontrada</p>';

  // Atualiza tipos de tarefa
  const selectTipoTarefa = document.getElementById('filtroTipoTarefa');
  selectTipoTarefa.innerHTML = '<option value="">Todos</option><option value="NENHUM">Nenhum</option>' +
    tiposTarefa.map(t => `<option value="${t}">${t}</option>`).join('');

  // Atualiza tarefas relacionadas
  const selectTipoRelacionada = document.getElementById('filtroTipoRelacionada');
  selectTipoRelacionada.innerHTML = '<option value="">Todas</option><option value="NENHUM">Nenhum</option>' +
    tiposRelacionada.map(t => `<option value="${t}">${t}</option>`).join('');

  // Atualiza grupos
  const selectGrupos = document.getElementById('filtroGrupos');
  selectGrupos.innerHTML = '<option value="">Todos</option>' +
    grupos.map(g => `<option value="${g}">${g}</option>`).join('');
}

function aplicarFiltros() {
  const responsaveis = Array.from(document.querySelectorAll('input[name="responsavel"]:checked')).map(cb => cb.value);
  const situacoes = Array.from(document.querySelectorAll('input[name="situacao"]:checked')).map(cb => cb.value);
  const tipoTarefa = document.getElementById('filtroTipoTarefa').value;
  const tipoRelacionada = document.getElementById('filtroTipoRelacionada').value;
  const grupos = document.getElementById('filtroGrupos').value;
  const dataCriacaoInicio = document.getElementById('filtroDataCriacaoInicio').value;
  const dataCriacaoFim = document.getElementById('filtroDataCriacaoFim').value;
  const dataFatalInicio = document.getElementById('filtroDataFatalInicio').value;
  const dataFatalFim = document.getElementById('filtroDataFatalFim').value;

  tarefasFiltradas = tarefas.filter(tarefa => {
    if (responsaveis.length > 0 && !responsaveis.some(r => tarefa.Responsaveis.split(',').map(n => n.trim()).includes(r))) return false;
    if (situacoes.length > 0 && !situacoes.includes(tarefa.Situacao)) return false;

    if (tipoTarefa) {
      if (tipoTarefa === 'NENHUM' && tarefa.Tipo.startsWith('#')) return false;
      if (tipoTarefa !== 'NENHUM' && tarefa.Tipo !== tipoTarefa) return false;
    }

    if (tipoRelacionada) {
      if (tipoRelacionada === 'NENHUM' && !tarefa.Tipo.startsWith('#') && tarefa.Tipo) return false;
      if (tipoRelacionada !== 'NENHUM' && tarefa.Tipo !== tipoRelacionada) return false;
    }

    if (grupos && tarefa.Grupos !== grupos) return false;

    const dataCriacao = tarefa.DataCriacao ? new Date(tarefa.DataCriacao) : null;
    if (dataCriacao) {
      if (dataCriacaoInicio && dataCriacao < new Date(dataCriacaoInicio + 'T00:00:00')) return false;
      if (dataCriacaoFim && dataCriacao > new Date(dataCriacaoFim + 'T23:59:59')) return false;
    } else if (dataCriacaoInicio || dataCriacaoFim) return false;

    const dataFatal = tarefa.DataFatal ? new Date(tarefa.DataFatal) : null;
    if (dataFatal) {
      if (dataFatalInicio && dataFatal < new Date(dataFatalInicio + 'T00:00:00')) return false;
      if (dataFatalFim && dataFatal > new Date(dataFatalFim + 'T23:59:59')) return false;
    } else if (dataFatalInicio || dataFatalFim) return false;

    return true;
  });

  processarTarefas();
}

function limparFiltros() {
  document.querySelectorAll('input[name="responsavel"]').forEach(cb => { cb.checked = false; });
  document.querySelectorAll('input[name="situacao"]').forEach(cb => { cb.checked = false; });
  document.getElementById('filtroTipoTarefa').value = '';
  document.getElementById('filtroTipoRelacionada').value = '';
  document.getElementById('filtroGrupos').value = '';
  document.getElementById('filtroDataCriacaoInicio').value = '';
  document.getElementById('filtroDataCriacaoFim').value = '';
  document.getElementById('filtroDataFatalInicio').value = '';
  document.getElementById('filtroDataFatalFim').value = '';

  if (tarefas.length > 0) {
    tarefasFiltradas = [...tarefas];
    processarTarefas();
  }
}

// ==================== FUNÇÕES DE PROCESSAMENTO ====================

function determinarStatus(tarefa) {
  const situacao = (tarefa.Situacao || '').toLowerCase().trim();

  if (situacao.includes('concluída com sucesso') || situacao.includes('concluídas com sucesso') ||
      situacao.includes('concluída sem sucesso') || situacao.includes('concluídas sem sucesso')) {
    return 'Concluído';
  }

  if (tarefa.DataFatal) {
    const dataFatal = new Date(tarefa.DataFatal);
    dataFatal.setHours(23, 59, 59, 999);

    if (!isNaN(dataFatal.getTime()) && dataFatal < hoje) {
      return 'Atraso';
    }
  }

  return 'Prazo em aberto';
}

function calcularDiasAtraso(dataFatalStr) {
  if (!dataFatalStr) return 0;

  const dataFatal = new Date(dataFatalStr);
  dataFatal.setHours(0, 0, 0, 0);

  if (dataFatal >= hoje) return 0;

  const diffTime = hoje.getTime() - dataFatal.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calcularTempoDecorrido(tarefa) {
  if (!tarefa.DataCriacao) return { dias: '-', color: 'text-gray-500' };

  const dataCriacao = new Date(tarefa.DataCriacao);
  const dataFim = tarefa.DataConclusao ? new Date(tarefa.DataConclusao) : hoje;
  const dataFatal = tarefa.DataFatal ? new Date(tarefa.DataFatal) : null;

  if (isNaN(dataCriacao.getTime()) || isNaN(dataFim.getTime())) return { dias: '-', color: 'text-gray-500' };

  const diffTime = dataFim.getTime() - dataCriacao.getTime();
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let color = 'text-gray-700';
  if (tarefa.DataConclusao && dataFatal && !isNaN(dataFatal.getTime()) && new Date(tarefa.DataConclusao) < dataFatal) {
    color = 'text-green-500';
  }

  return { dias, color };
}

function calcularTempoOtimizado(dataConclusaoStr, dataFatalStr) {
  if (!dataConclusaoStr || !dataFatalStr) return { dias: '-', color: 'text-gray-500' };

  const dataConclusao = new Date(dataConclusaoStr);
  const dataFatal = new Date(dataFatalStr);

  if (isNaN(dataConclusao.getTime()) || isNaN(dataFatal.getTime())) return { dias: '-', color: 'text-gray-500' };

  const diffTime = dataFatal.getTime() - dataConclusao.getTime();
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return { dias: dias >= 0 ? dias : '-', color: dias >= 0 ? 'text-green-500' : 'text-gray-500' };
}

function formatarDataExibicao(dataStr) {
  if (!dataStr) return '-';

  try {
    const [year, month, day] = dataStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dataStr;
  }
}

function processarTarefas() {
  const contadores = {
    total: tarefasFiltradas.length,
    concluidas: 0,
    atraso: 0,
    emAberto: 0
  };

  atrasos = [];
  adiantadas = [];

  tarefasFiltradas.forEach(tarefa => {
    const status = determinarStatus(tarefa);
    if (status === 'Concluído') {
      contadores.concluidas++;
      if (tarefa.DataConclusao && tarefa.DataFatal) {
        const dataConclusao = new Date(tarefa.DataConclusao);
        const dataFatal = new Date(tarefa.DataFatal);
        if (!isNaN(dataConclusao.getTime()) && !isNaN(dataFatal.getTime()) && dataConclusao < dataFatal) {
          tarefa.TempoOtimizado = calcularTempoOtimizado(tarefa.DataConclusao, tarefa.DataFatal).dias;
          adiantadas.push(tarefa);
        }
      }
    } else if (status === 'Atraso') {
      contadores.atraso++;
      tarefa.DiasAtraso = calcularDiasAtraso(tarefa.DataFatal);
      tarefa.TempoDecorrido = calcularTempoDecorrido(tarefa).dias;
      atrasos.push(tarefa);
    } else {
      contadores.emAberto++;
    }
  });

  if (!document.getElementById('tabelaContent').classList.contains('hidden')) {
    ordenarTarefas(tarefasFiltradas);
    renderizarTabelaCompleta(tarefasFiltradas);
  }

  ordenarTarefasAtraso(atrasos);
  renderizarTabelaAtrasos(atrasos);
  ordenarTarefasAdiantadas(adiantadas);
  renderizarTabelaAdiantadas(adiantadas);
  atualizarIconesOrdenacaoAtraso();
  atualizarIconesOrdenacaoAdiantadas();

  atualizarResumo(contadores);
  atualizarGraficos(contadores);
}

// ==================== FUNÇÕES DE RENDERIZAÇÃO ====================

function renderizarTabelaCompleta(tarefasParaRenderizar) {
  const tabela = document.getElementById('tabelaTarefas');
  tabela.innerHTML = '';

  if (tarefasParaRenderizar.length === 0) {
    tabela.innerHTML = '<tr><td class="p-3 text-gray-500 italic border" colspan="12">Nenhuma tarefa encontrada.</td></tr>';
    return;
  }

  tarefasParaRenderizar.forEach(tarefa => {
    const status = determinarStatus(tarefa);
    const row = document.createElement('tr');
    row.classList.add('zebra-stripe');
    row.innerHTML = `
      <td class="p-3 border">${tarefa.Pasta || '-'}</td>
      <td class="p-3 border">${tarefa.Identificador || '-'}</td>
      <td class="p-3 border">${tarefa.Responsaveis || '-'}</td>
      <td class="p-3 border">${tarefa.Tipo || '-'}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataCriacao)}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataBase)}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataPrevista)}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataFatal)}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataConclusao)}</td>
      <td class="p-3 border">${tarefa.Grupos || '-'}</td>
      <td class="p-3 border">${tarefa.Situacao || '-'}</td>
      <td class="p-3 border">
        <span class="px-2 py-1 rounded text-xs font-semibold ${
          status === 'Concluído' ? 'status-concluido' :
          status === 'Prazo em aberto' ? 'status-aberto' : 'status-atraso'
        }">
          <i class="fas ${
            status === 'Concluído' ? 'fa-check-circle' :
            status === 'Prazo em aberto' ? 'fa-clock' : 'fa-exclamation-circle'
          } mr-1"></i>
          ${status}
        </span>
      </td>
    `;
    tabela.appendChild(row);
  });
}

function renderizarTabelaAtrasos(atrasos) {
  const atrasoLista = document.getElementById('listaAtrasos');
  atrasoLista.innerHTML = '';

  if (atrasos.length === 0) {
    atrasoLista.innerHTML = '<tr><td class="p-3 text-gray-500 italic border" colspan="7">Nenhuma tarefa em atraso.</td></tr>';
    return;
  }

  atrasos.forEach(tarefa => {
    const { dias, color } = calcularTempoDecorrido(tarefa);
    const atrasoRow = document.createElement('tr');
    atrasoRow.classList.add('zebra-stripe');
    atrasoRow.innerHTML = `
      <td class="p-3 border">${tarefa.Pasta || '-'}</td>
      <td class="p-3 border">${tarefa.Identificador || '-'}</td>
      <td class="p-3 border">${tarefa.Responsaveis || '-'}</td>
      <td class="p-3 border">${tarefa.Tipo || '-'}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataFatal)}</td>
      <td class="p-3 text-red-500 font-semibold border">${tarefa.DiasAtraso} dias</td>
      <td class="p-3 ${color} font-semibold border">${dias} dias</td>
    `;
    atrasoLista.appendChild(atrasoRow);
  });
}

function renderizarTabelaAdiantadas(adiantadas) {
  const adiantadasLista = document.getElementById('listaAdiantadas');
  adiantadasLista.innerHTML = '';

  if (adiantadas.length === 0) {
    adiantadasLista.innerHTML = '<tr><td class="p-3 text-gray-500 italic border" colspan="8">Nenhuma tarefa adiantada.</td></tr>';
    return;
  }

  adiantadas.forEach(tarefa => {
    const { dias: diasDecorrido, color: colorDecorrido } = calcularTempoDecorrido(tarefa);
    const { dias: diasOtimizado, color: colorOtimizado } = calcularTempoOtimizado(tarefa.DataConclusao, tarefa.DataFatal);
    const adiantadaRow = document.createElement('tr');
    adiantadaRow.classList.add('zebra-stripe');
    adiantadaRow.innerHTML = `
      <td class="p-3 border">${tarefa.Pasta || '-'}</td>
      <td class="p-3 border">${tarefa.Identificador || '-'}</td>
      <td class="p-3 border">${tarefa.Responsaveis || '-'}</td>
      <td class="p-3 border">${tarefa.Tipo || '-'}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataCriacao)}</td>
      <td class="p-3 border">${formatarDataExibicao(tarefa.DataConclusao)}</td>
      <td class="p-3 ${colorDecorrido} font-semibold border">${diasDecorrido} dias</td>
      <td class="p-3 ${colorOtimizado} font-semibold border">${diasOtimizado} dias</td>
    `;
    adiantadasLista.appendChild(adiantadaRow);
  });
}

function atualizarResumo(contadores) {
  document.getElementById('totalTarefas').textContent = contadores.total;
  document.getElementById('contadorAtraso').textContent = contadores.atraso;
  document.getElementById('tarefasConcluidas').textContent = contadores.concluidas;
  document.getElementById('contadorEmAberto').textContent = contadores.emAberto;

  const taxa = contadores.total > 0 ? ((contadores.concluidas / contadores.total) * 100).toFixed(1) : '0';
  document.getElementById('taxaConclusao').textContent = `${taxa}%`;
}

// ==================== FUNÇÕES DE GRÁFICOS ====================

function atualizarGraficos(contadores) {
  if (chartStatus) chartStatus.destroy();
  if (chartTipo) chartTipo.destroy();
  if (chartTaxaConclusao) chartTaxaConclusao.destroy();

  const ctxStatus = document.getElementById('graficoStatus').getContext('2d');
  chartStatus = new Chart(ctxStatus, {
    type: 'pie',
    data: {
      labels: ['Concluído', 'Prazo em aberto', 'Atraso'],
      datasets: [{
        data: [contadores.concluidas, contadores.emAberto, contadores.atraso],
        backgroundColor: ['#22c55e', '#3b82f6', '#ef4444'],
        borderColor: ['#ffffff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed * 100) / total).toFixed(1) : 0;
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  const tipos = [...new Set(tarefasFiltradas.map(t => t.Tipo))].filter(Boolean);
  const dadosPorTipo = tipos.map(tipo =>
    tarefasFiltradas.filter(t => t.Tipo === tipo).length
  );

  const ctxTipo = document.getElementById('graficoTipo').getContext('2d');
  chartTipo = new Chart(ctxTipo, {
    type: 'bar',
    data: {
      labels: tipos.length > 0 ? tipos : ['Nenhum tipo'],
      datasets: [{
        label: 'Número de Tarefas',
        data: dadosPorTipo.length > 0 ? dadosPorTipo : [0],
        backgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } }
    }
  });

  const ctxTaxaConclusao = document.getElementById('graficoTaxaConclusao').getContext('2d');
  chartTaxaConclusao = new Chart(ctxTaxaConclusao, {
    type: 'doughnut',
    data: {
      labels: ['Concluídas', 'Não Concluídas'],
      datasets: [{
        data: [contadores.concluidas, contadores.total - contadores.concluidas],
        backgroundColor: ['#22c55e', '#e5e7eb'],
        borderColor: ['#ffffff'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      cutout: '60%'
    }
  });
}

// ==================== FUNÇÕES DE EXPORTAÇÃO ====================

function exportarExcel() {
  if (tarefasFiltradas.length === 0) {
    mostrarMensagem('erro', 'Nenhuma tarefa para exportar.');
    return;
  }

  const workbook = XLSX.utils.book_new();

  // Aba 1: Lista Completa
  const dataCompleta = tarefasFiltradas.map(tarefa => ({
    'Pasta': tarefa.Pasta || '-',
    'Identificador da tarefa': tarefa.Identificador || '-',
    'Responsáveis da tarefa': tarefa.Responsaveis || '-',
    'Tipo de tarefa': tarefa.Tipo || '-',
    'Data de criação': formatarDataExibicao(tarefa.DataCriacao),
    'Data base': formatarDataExibicao(tarefa.DataBase),
    'Data prevista': formatarDataExibicao(tarefa.DataPrevista),
    'Data fatal': formatarDataExibicao(tarefa.DataFatal),
    'Data da conclusão': formatarDataExibicao(tarefa.DataConclusao),
    'Grupos de trabalho': tarefa.Grupos || '-',
    'Situação': tarefa.Situacao || '-',
    'Status': determinarStatus(tarefa)
  }));
  const wsCompleta = XLSX.utils.json_to_sheet(dataCompleta);
  XLSX.utils.book_append_sheet(workbook, wsCompleta, 'Lista Completa');

  // Aba 2: Tarefas em Atraso
  const dataAtraso = atrasos.map(tarefa => ({
    'Pasta': tarefa.Pasta || '-',
    'Identificador da tarefa': tarefa.Identificador || '-',
    'Responsável': tarefa.Responsaveis || '-',
    'Tipo de tarefa': tarefa.Tipo || '-',
    'Data fatal': formatarDataExibicao(tarefa.DataFatal),
    'Dias em atraso': tarefa.DiasAtraso,
    'Tempo Decorrido': tarefa.TempoDecorrido
  }));
  const wsAtraso = XLSX.utils.json_to_sheet(dataAtraso);
  XLSX.utils.book_append_sheet(workbook, wsAtraso, 'Tarefas em Atraso');

  // Aba 3: Tarefas Adiantadas
  const dataAdiantadas = adiantadas.map(tarefa => ({
    'Pasta': tarefa.Pasta || '-',
    'Identificador da tarefa': tarefa.Identificador || '-',
    'Responsável': tarefa.Responsaveis || '-',
    'Tipo de tarefa': tarefa.Tipo || '-',
    'Data de criação': formatarDataExibicao(tarefa.DataCriacao),
    'Data da conclusão': formatarDataExibicao(tarefa.DataConclusao),
    'Tempo Decorrido': calcularTempoDecorrido(tarefa).dias,
    'Tempo Otimizado': tarefa.TempoOtimizado
  }));
  const wsAdiantadas = XLSX.utils.json_to_sheet(dataAdiantadas);
  XLSX.utils.book_append_sheet(workbook, wsAdiantadas, 'Tarefas Adiantadas');

  XLSX.writeFile(workbook, `tarefas_projuris_${new Date().toISOString().split('T')[0]}.xlsx`);
  mostrarMensagem('sucesso', '✓ Excel exportado com sucesso!');
}

// ==================== FUNÇÕES DE ORDENAÇÃO ====================

function ordenarTarefas(arrayParaOrdenar) {
  const { key, direction } = sortConfig;
  if (direction === 'none' || !key) return;

  const eData = (str) => str ? new Date(str).getTime() : 0;
  const statusOrder = { 'Atraso': 1, 'Prazo em aberto': 2, 'Concluído': 3 };

  arrayParaOrdenar.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case 'DataCriacao': case 'DataBase': case 'DataPrevista': case 'DataFatal': case 'DataConclusao':
        valA = eData(a[key]); valB = eData(b[key]); break;
      case 'Status':
        valA = statusOrder[determinarStatus(a)] || 99; valB = statusOrder[determinarStatus(b)] || 99; break;
      case 'Pasta':
      case 'Identificador':
        valA = parseInt(a[key], 10) || 0; valB = parseInt(b[key], 10) || 0; break;
      default:
        valA = String(a[key] || '').toLowerCase(); valB = String(b[key] || '').toLowerCase(); break;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function ordenarTarefasAtraso(arrayParaOrdenar) {
  const { key, direction } = sortConfigAtraso;
  if (direction === 'none' || !key) return;

  const eData = (str) => str ? new Date(str).getTime() : 0;

  arrayParaOrdenar.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case 'DataFatal':
        valA = eData(a[key]); valB = eData(b[key]); break;
      case 'DiasAtraso':
      case 'Pasta':
      case 'Identificador':
        valA = parseInt(a[key], 10) || 0; valB = parseInt(b[key], 10) || 0; break;
      case 'TempoDecorrido':
        valA = calcularTempoDecorrido(a).dias;
        valB = calcularTempoDecorrido(b).dias;
        valA = typeof valA === 'number' ? valA : -Infinity;
        valB = typeof valB === 'number' ? valB : -Infinity;
        break;
      default:
        valA = String(a[key] || '').toLowerCase(); valB = String(b[key] || '').toLowerCase(); break;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function ordenarTarefasAdiantadas(arrayParaOrdenar) {
  const { key, direction } = sortConfigAdiantadas;
  if (direction === 'none' || !key) return;

  const eData = (str) => str ? new Date(str).getTime() : 0;

  arrayParaOrdenar.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case 'DataCriacao': case 'DataConclusao':
        valA = eData(a[key]); valB = eData(b[key]); break;
      case 'Pasta':
      case 'Identificador':
        valA = parseInt(a[key], 10) || 0; valB = parseInt(b[key], 10) || 0; break;
      case 'TempoDecorrido':
        valA = calcularTempoDecorrido(a).dias;
        valB = calcularTempoDecorrido(b).dias;
        valA = typeof valA === 'number' ? valA : -Infinity;
        valB = typeof valB === 'number' ? valB : -Infinity;
        break;
      case 'TempoOtimizado':
        valA = calcularTempoOtimizado(a.DataConclusao, a.DataFatal).dias;
        valB = calcularTempoOtimizado(b.DataConclusao, b.DataFatal).dias;
        valA = typeof valA === 'number' ? valA : -Infinity;
        valB = typeof valB === 'number' ? valB : -Infinity;
        break;
      default:
        valA = String(a[key] || '').toLowerCase(); valB = String(b[key] || '').toLowerCase(); break;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function atualizarIconesOrdenacao() {
  document.querySelectorAll('.sortable-header').forEach(header => {
    const icon = header.querySelector('.sort-icon');
    const key = header.getAttribute('data-column-key');
    icon.classList.remove('fa-sort', 'fa-sort-up', 'fa-sort-down', 'active');
    if (key === sortConfig.key) {
      icon.classList.add('active');
      if (sortConfig.direction === 'asc') icon.classList.add('fa-sort-up');
      else if (sortConfig.direction === 'desc') icon.classList.add('fa-sort-down');
      else icon.classList.add('fa-sort');
    } else {
      icon.classList.add('fa-sort');
    }
  });
}

function atualizarIconesOrdenacaoAtraso() {
  document.querySelectorAll('.sortable-header-atraso').forEach(header => {
    const icon = header.querySelector('.sort-icon');
    const key = header.getAttribute('data-column-key');
    icon.classList.remove('fa-sort', 'fa-sort-up', 'fa-sort-down', 'active');
    if (key === sortConfigAtraso.key) {
      icon.classList.add('active');
      if (sortConfigAtraso.direction === 'asc') icon.classList.add('fa-sort-up');
      else if (sortConfigAtraso.direction === 'desc') icon.classList.add('fa-sort-down');
      else icon.classList.add('fa-sort');
    } else {
      icon.classList.add('fa-sort');
    }
  });
}

function atualizarIconesOrdenacaoAdiantadas() {
  document.querySelectorAll('.sortable-header-adiantadas').forEach(header => {
    const icon = header.querySelector('.sort-icon');
    const key = header.getAttribute('data-column-key');
    icon.classList.remove('fa-sort', 'fa-sort-up', 'fa-sort-down', 'active');
    if (key === sortConfigAdiantadas.key) {
      icon.classList.add('active');
      if (sortConfigAdiantadas.direction === 'asc') icon.classList.add('fa-sort-up');
      else if (sortConfigAdiantadas.direction === 'desc') icon.classList.add('fa-sort-down');
      else icon.classList.add('fa-sort');
    } else {
      icon.classList.add('fa-sort');
    }
  });
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
  // Configuração de ordenação para tabela completa
  document.querySelectorAll('.sortable-header').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.getAttribute('data-column-key');
      if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
      }
      ordenarTarefas(tarefasFiltradas);
      renderizarTabelaCompleta(tarefasFiltradas);
      atualizarIconesOrdenacao();
    });
  });

  // Configuração de ordenação para tabela de atrasos
  document.querySelectorAll('.sortable-header-atraso').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.getAttribute('data-column-key');
      if (sortConfigAtraso.key === key) {
        sortConfigAtraso.direction = sortConfigAtraso.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfigAtraso.key = key;
        sortConfigAtraso.direction = 'asc';
      }
      processarTarefas();
    });
  });

  // Configuração de ordenação para tabela de adiantadas
  document.querySelectorAll('.sortable-header-adiantadas').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.getAttribute('data-column-key');
      if (sortConfigAdiantadas.key === key) {
        sortConfigAdiantadas.direction = sortConfigAdiantadas.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfigAdiantadas.key = key;
        sortConfigAdiantadas.direction = 'asc';
      }
      processarTarefas();
    });
  });

  // Event listeners para filtros
  document.getElementById('filtroTipoTarefa').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroTipoRelacionada').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroGrupos').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroDataCriacaoInicio').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroDataCriacaoFim').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroDataFatalInicio').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroDataFatalFim').addEventListener('change', aplicarFiltros);

  // Inicializa seções expandidas
  document.getElementById('graficosContent').classList.remove('hidden');
  document.getElementById('adiantadasContent').classList.remove('hidden');
  document.getElementById('atrasosContent').classList.remove('hidden');

  // Carrega dados automaticamente ao iniciar
  console.log('Dashboard inicializado. Carregando dados da API...');
  carregarDadosDaAPI();
});
