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

      // Monta o payload de consulta baseado na documentação
      const payload = {
        filtro: {
          // Filtros de data
          ...(filtros.dataCriacaoInicio && {
            dataCriacaoInicio: this.formatDate(filtros.dataCriacaoInicio)
          }),
          ...(filtros.dataCriacaoFim && {
            dataCriacaoFim: this.formatDate(filtros.dataCriacaoFim)
          }),
          ...(filtros.dataFatalInicio && {
            dataFatalInicio: this.formatDate(filtros.dataFatalInicio)
          }),
          ...(filtros.dataFatalFim && {
            dataFatalFim: this.formatDate(filtros.dataFatalFim)
          }),
          // Outros filtros
          ...(filtros.responsaveis && { responsaveis: filtros.responsaveis }),
          ...(filtros.tipo && { tipo: filtros.tipo }),
          ...(filtros.situacao && { situacao: filtros.situacao }),
          ...(filtros.gruposTrabalho && { gruposTrabalho: filtros.gruposTrabalho })
        },
        // Paginação (ajuste conforme necessário)
        tamanhoPagina: filtros.limite || 1000,
        numeroPagina: filtros.pagina || 0
      };

      // Tenta diferentes endpoints da API
      let tarefas = [];

      // Endpoint 1: consulta-com-paginacao (mais comum)
      try {
        const response = await client.post('/tarefa/consulta-com-paginacao', payload);
        tarefas = this.processarResposta(response.data);
        console.log(`✓ ${tarefas.length} tarefas encontradas (consulta-com-paginacao)`);
      } catch (error) {
        console.log('→ Tentando endpoint alternativo (consulta-detalhada)...');

        // Endpoint 2: consulta-detalhada
        try {
          const response = await client.post('/tarefa/consulta-detalhada', payload);
          tarefas = this.processarResposta(response.data);
          console.log(`✓ ${tarefas.length} tarefas encontradas (consulta-detalhada)`);
        } catch (error2) {
          console.log('→ Tentando endpoint simplificado (/tarefa)...');

          // Endpoint 3: GET simples
          const response = await client.get('/tarefa', { params: payload.filtro });
          tarefas = this.processarResposta(response.data);
          console.log(`✓ ${tarefas.length} tarefas encontradas (GET /tarefa)`);
        }
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
      // A API pode retornar em diferentes formatos
      let tarefasRaw = [];

      if (Array.isArray(data)) {
        tarefasRaw = data;
      } else if (data.lista) {
        tarefasRaw = data.lista;
      } else if (data.tarefas) {
        tarefasRaw = data.tarefas;
      } else if (data.content) {
        tarefasRaw = data.content;
      } else if (data.items) {
        tarefasRaw = data.items;
      } else {
        tarefasRaw = [data];
      }

      // Normaliza cada tarefa para o formato esperado pelo dashboard
      return tarefasRaw.map(tarefa => this.normalizarTarefa(tarefa));
    } catch (error) {
      console.error('✗ Erro ao processar resposta:', error.message);
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
