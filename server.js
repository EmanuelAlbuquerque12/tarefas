require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const projurisApi = require('./services/projurisApi');
const projurisAuth = require('./services/projurisAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// Função para verificar configuração
function verificarConfiguracao() {
  console.log('\n🔍 Verificando configuração...\n');

  const requiredVars = [
    'PROJURIS_TOKEN_URL',
    'PROJURIS_CLIENT_ID',
    'PROJURIS_CLIENT_SECRET',
    'PROJURIS_USER',
    'PROJURIS_PASSWORD',
    'PROJURIS_DOMAIN',
    'PROJURIS_API_URL'
  ];

  const missing = [];
  const configured = [];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'undefined') {
      missing.push(varName);
      console.log(`  ❌ ${varName}: NÃO CONFIGURADA`);
    } else {
      configured.push(varName);
      // Mostra apenas parte do valor para segurança
      const displayValue = varName.includes('PASSWORD') || varName.includes('SECRET')
        ? '***'
        : value.length > 50
          ? value.substring(0, 47) + '...'
          : value;
      console.log(`  ✓ ${varName}: ${displayValue}`);
    }
  });

  console.log('');

  if (missing.length > 0) {
    console.error('⚠️  AVISO: Variáveis de ambiente faltando!');
    console.error('   Crie um arquivo .env na raiz do projeto com:');
    missing.forEach(varName => {
      console.error(`   ${varName}=seu_valor_aqui`);
    });
    console.error('');
  } else {
    console.log('✓ Todas as variáveis de ambiente estão configuradas!\n');
  }

  return missing.length === 0;
}

// Verifica configuração antes de iniciar
verificarConfiguracao();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS DA API ====================

/**
 * GET /api/health
 * Verifica se o servidor está funcionando
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasValidToken: projurisAuth.hasValidToken()
  });
});

/**
 * GET /api/tarefas
 * Busca todas as tarefas da API Projuris
 * Query params opcionais: dataCriacaoInicio, dataCriacaoFim, dataFatalInicio, dataFatalFim, etc.
 */
app.get('/api/tarefas', async (req, res) => {
  try {
    const filtros = {
      dataCriacaoInicio: req.query.dataCriacaoInicio,
      dataCriacaoFim: req.query.dataCriacaoFim,
      dataFatalInicio: req.query.dataFatalInicio,
      dataFatalFim: req.query.dataFatalFim,
      responsaveis: req.query.responsaveis,
      tipo: req.query.tipo,
      situacao: req.query.situacao,
      gruposTrabalho: req.query.gruposTrabalho,
      limite: req.query.limite ? parseInt(req.query.limite) : 1000,
      pagina: req.query.pagina ? parseInt(req.query.pagina) : 0
    };

    // Remove filtros undefined
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined || filtros[key] === null || filtros[key] === '') {
        delete filtros[key];
      }
    });

    const tarefas = await projurisApi.getTarefas(filtros);

    res.json({
      success: true,
      total: tarefas.length,
      data: tarefas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/tarefas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/tarefas/filtradas
 * Busca tarefas com filtros complexos via POST
 */
app.post('/api/tarefas/filtradas', async (req, res) => {
  try {
    const filtros = req.body;
    const tarefas = await projurisApi.getTarefas(filtros);

    res.json({
      success: true,
      total: tarefas.length,
      data: tarefas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/tarefas/filtradas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/tipos-tarefa
 * Busca tipos de tarefa disponíveis
 */
app.get('/api/tipos-tarefa', async (req, res) => {
  try {
    const tipos = await projurisApi.getTiposTarefa();
    res.json({
      success: true,
      data: tipos,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/tipos-tarefa:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/situacoes
 * Busca situações disponíveis
 */
app.get('/api/situacoes', async (req, res) => {
  try {
    const situacoes = await projurisApi.getSituacoes();
    res.json({
      success: true,
      data: situacoes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/situacoes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/auth/refresh
 * Força renovação do token
 */
app.post('/api/auth/refresh', async (req, res) => {
  try {
    projurisAuth.clearTokenCache();
    const newToken = await projurisAuth.getAccessToken();
    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      hasToken: !!newToken,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/auth/refresh:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== ROTAS DO FRONTEND ====================

/**
 * GET /
 * Página principal do dashboard
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Tratamento global de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log('\n================================================');
  console.log('🚀 Servidor Dashboard Projuris iniciado!');
  console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 API Projuris: ${process.env.PROJURIS_API_URL}`);
  console.log('================================================\n');
  console.log('Endpoints disponíveis:');
  console.log('  GET  /                           - Dashboard');
  console.log('  GET  /api/health                 - Status do servidor');
  console.log('  GET  /api/tarefas                - Buscar tarefas');
  console.log('  POST /api/tarefas/filtradas      - Buscar com filtros');
  console.log('  GET  /api/tipos-tarefa           - Tipos de tarefa');
  console.log('  GET  /api/situacoes              - Situações');
  console.log('  POST /api/auth/refresh           - Renovar token');
  console.log('================================================\n');
});

// Tratamento de sinais de encerramento
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido. Encerrando servidor...');
  process.exit(0);
});
