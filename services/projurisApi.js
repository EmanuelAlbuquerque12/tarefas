const axios = require('axios');
const projurisAuth = require('./projurisAuth');

class ProjurisApi {
  constructor() {
    this.apiUrl = process.env.PROJURIS_API_URL;
  }

  /**
   * Cria um cliente axios com autenticação
   */
  async getAuthenticatedClient() {
    const token = await projurisAuth.getAccessToken();
    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 60000 // 60 segundos
    });
  }

  /**
   * Formata data no padrão da API
   */
  formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Busca tarefas da API Projuris com filtros opcionais
   */
  async getTarefas(filtros = {}) {
    try {
      console.log('→ Buscando tarefas da API Projuris...');

      const client = await this.getAuthenticatedClient();

      let tarefas = [];
      let endpointUsado = '';

      // Tenta diferentes endpoints da API em ordem de preferência
      const endpoints = [
        { url: '/tarefa/consulta-sem-paginacao', method: 'POST', name: 'consulta-sem-paginacao' },
        { url: '/tarefa/consulta-sem-paginacao', method: 'GET', name: 'consulta-sem-paginacao (GET)' },
        { url: '/tarefa/consulta-com-paginacao', method: 'POST', name: 'consulta-com-paginacao' },
        { url: '/tarefa', method: 'GET', name: 'tarefa (GET simples)' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`→ Tentando endpoint: ${endpoint.method} ${endpoint.url}`);

          let response;

          if (endpoint.method === 'POST') {
            // Para POST, envia payload vazio ou com filtros mínimos
            const payload = {};

            // Adiciona filtros apenas se fornecidos
            if (Object.keys(filtros).length > 0) {
              payload.filtro = {};

              if (filtros.dataCriacaoInicio) payload.filtro.dataCriacaoInicio = this.formatDate(filtros.dataCriacaoInicio);
              if (filtros.dataCriacaoFim) payload.filtro.dataCriacaoFim = this.formatDate(filtros.dataCriacaoFim);
              if (filtros.dataFatalInicio) payload.filtro.dataFatalInicio = this.formatDate(filtros.dataFatalInicio);
              if (filtros.dataFatalFim) payload.filtro.dataFatalFim = this.formatDate(filtros.dataFatalFim);
            }

            console.log('  Payload:', JSON.stringify(payload));
            response = await client.post(endpoint.url, payload);
          } else {
            // Para GET, usa query params
            response = await client.get(endpoint.url);
          }

          console.log('  Status:', response.status);
          console.log('  Tipo de dados recebidos:', Array.isArray(response.data) ? 'Array' : typeof response.data);

          if (response.data) {
            tarefas = this.processarResposta(response.data);
            endpointUsado = endpoint.name;
            console.log(`✓ ${tarefas.length} tarefas encontradas usando ${endpoint.name}`);
            break; // Encontrou dados, sai do loop
          }
        } catch (error) {
          console.log(`  ✗ Falhou: ${error.response?.status || error.message}`);
          if (error.response?.data) {
            console.log('  Resposta:', JSON.stringify(error.response.data).substring(0, 200));
          }
          // Continua tentando próximo endpoint
        }
      }

      if (tarefas.length === 0) {
        console.log('⚠️  Nenhuma tarefa encontrada em nenhum endpoint. Isso pode significar:');
        console.log('   - Não há tarefas cadastradas');
        console.log('   - Os endpoints da API mudaram');
        console.log('   - É necessário enviar filtros específicos');
      }

      return tarefas;
    } catch (error) {
      console.error('✗ Erro ao buscar tarefas:', error.response?.data || error.message);

      // Se o erro for de autenticação, limpa o cache e tenta novamente
      if (error.response?.status === 401) {
        console.log('→ Token expirado, renovando...');
        projurisAuth.clearTokenCache();
        return this.getTarefas(filtros); // Tenta novamente recursivamente
      }

      throw new Error(`Erro ao buscar tarefas: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Processa a resposta da API e normaliza os dados
   */
  processarResposta(data) {
    try {
      console.log('→ Processando resposta da API...');
      console.log('  Tipo de data:', typeof data);
      console.log('  É array?', Array.isArray(data));

      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        console.log('  Chaves do objeto:', keys.slice(0, 10)); // Primeiras 10 chaves

        // Se tiver poucas chaves, mostra todas
        if (keys.length <= 5 && keys.length > 0) {
          console.log('  Estrutura:', JSON.stringify(data, null, 2).substring(0, 500));
        }
      }

      // A API pode retornar em diferentes formatos
      let tarefasRaw = [];

      if (Array.isArray(data)) {
        console.log('  → Detectado: Array direto');
        tarefasRaw = data;
      } else if (data.lista && Array.isArray(data.lista)) {
        console.log('  → Detectado: data.lista');
        tarefasRaw = data.lista;
      } else if (data.tarefas && Array.isArray(data.tarefas)) {
        console.log('  → Detectado: data.tarefas');
        tarefasRaw = data.tarefas;
      } else if (data.content && Array.isArray(data.content)) {
        console.log('  → Detectado: data.content');
        tarefasRaw = data.content;
      } else if (data.items && Array.isArray(data.items)) {
        console.log('  → Detectado: data.items');
        tarefasRaw = data.items;
      } else if (data.resultado && Array.isArray(data.resultado)) {
        console.log('  → Detectado: data.resultado');
        tarefasRaw = data.resultado;
      } else if (data.dados && Array.isArray(data.dados)) {
        console.log('  → Detectado: data.dados');
        tarefasRaw = data.dados;
      } else if (data.data && Array.isArray(data.data)) {
        console.log('  → Detectado: data.data');
        tarefasRaw = data.data;
      } else if (data && typeof data === 'object') {
        console.log('  → Detectado: Objeto único');
        tarefasRaw = [data];
      } else {
        console.log('  ⚠️  Formato desconhecido, tentando usar data como array');
        tarefasRaw = [];
      }

      console.log(`  Total de tarefas brutas encontradas: ${tarefasRaw.length}`);

      if (tarefasRaw.length > 0) {
        console.log('  Exemplo da primeira tarefa (primeiros campos):');
        const primeiraTarefa = tarefasRaw[0];
        if (primeiraTarefa && typeof primeiraTarefa === 'object') {
          const camposExemplo = Object.keys(primeiraTarefa).slice(0, 10);
          console.log('  Campos:', camposExemplo);
        }
      }

      // Normaliza cada tarefa para o formato esperado pelo dashboard
      const tarefasNormalizadas = tarefasRaw
        .filter(t => t && typeof t === 'object') // Remove valores null/undefined
        .map(tarefa => this.normalizarTarefa(tarefa));

      console.log(`  ✓ ${tarefasNormalizadas.length} tarefas normalizadas`);

      return tarefasNormalizadas;
    } catch (error) {
      console.error('✗ Erro ao processar resposta:', error.message);
      console.error('  Stack:', error.stack);
      return [];
    }
  }

  /**
   * Normaliza uma tarefa para o formato esperado pelo dashboard
   */
  normalizarTarefa(tarefa) {
    return {
      // Mapeia os campos da API para os campos esperados pelo dashboard
      'Identificador do módulo': tarefa.identificadorModulo ||
                                  tarefa.modulo?.identificador ||
                                  tarefa.pasta ||
                                  tarefa.pastaId ||
                                  '',
      'Identificador da tarefa': tarefa.identificador ||
                                 tarefa.id ||
                                 tarefa.codigoTarefa ||
                                 '',
      'Responsáveis da tarefa': this.extrairResponsaveis(tarefa),
      'Tipo de tarefa': tarefa.tipo ||
                       tarefa.tipoTarefa ||
                       tarefa.descricaoTipo ||
                       '',
      'Data de criação': this.formatarData(
        tarefa.dataCriacao ||
        tarefa.dataInclusao ||
        tarefa.dataAbertura
      ),
      'Data base': this.formatarData(tarefa.dataBase),
      'Data prevista': this.formatarData(
        tarefa.dataPrevista ||
        tarefa.prazo
      ),
      'Data fatal': this.formatarData(
        tarefa.dataFatal ||
        tarefa.dataLimite
      ),
      'Data da conclusão': this.formatarData(
        tarefa.dataConclusao ||
        tarefa.dataFinalizacao
      ),
      'Grupos de trabalho': this.extrairGrupos(tarefa),
      'Situação': tarefa.situacao ||
                 tarefa.status ||
                 tarefa.descricaoSituacao ||
                 ''
    };
  }

  /**
   * Extrai responsáveis da tarefa (pode estar em diferentes formatos)
   */
  extrairResponsaveis(tarefa) {
    if (tarefa.responsaveis) {
      if (Array.isArray(tarefa.responsaveis)) {
        return tarefa.responsaveis.map(r => r.nome || r).join(', ');
      }
      return String(tarefa.responsaveis);
    }
    if (tarefa.responsavel) {
      return tarefa.responsavel.nome || tarefa.responsavel;
    }
    if (tarefa.usuario) {
      return tarefa.usuario.nome || tarefa.usuario;
    }
    return '';
  }

  /**
   * Extrai grupos de trabalho
   */
  extrairGrupos(tarefa) {
    if (tarefa.gruposTrabalho) {
      if (Array.isArray(tarefa.gruposTrabalho)) {
        return tarefa.gruposTrabalho.map(g => g.nome || g).join(', ');
      }
      return String(tarefa.gruposTrabalho);
    }
    if (tarefa.grupo) {
      return tarefa.grupo.nome || tarefa.grupo;
    }
    return '';
  }

  /**
   * Formata data para o padrão DD/MM/YYYY
   */
  formatarData(data) {
    if (!data) return '';

    try {
      const d = new Date(data);
      if (isNaN(d.getTime())) return '';

      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const ano = d.getFullYear();

      return `${dia}/${mes}/${ano}`;
    } catch {
      return '';
    }
  }

  /**
   * Busca informações sobre tipos de tarefa disponíveis
   */
  async getTiposTarefa() {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.get('/tarefa/tipos');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de tarefa:', error.message);
      return [];
    }
  }

  /**
   * Busca situações disponíveis
   */
  async getSituacoes() {
    try {
      const client = await this.getAuthenticatedClient();
      const response = await client.get('/tarefa/situacoes');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar situações:', error.message);
      return [];
    }
  }
}

module.exports = new ProjurisApi();
