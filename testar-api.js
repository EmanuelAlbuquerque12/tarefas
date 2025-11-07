/**
 * Script de teste para verificar autenticação com API Projuris
 * Execute: node testar-api.js
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n================================================');
console.log('   TESTE DE AUTENTICAÇÃO API PROJURIS');
console.log('================================================\n');

// Verifica variáveis de ambiente
console.log('📋 Variáveis de ambiente:');
console.log(`   PROJURIS_TOKEN_URL: ${process.env.PROJURIS_TOKEN_URL || '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_CLIENT_ID: ${process.env.PROJURIS_CLIENT_ID || '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_CLIENT_SECRET: ${process.env.PROJURIS_CLIENT_SECRET ? '***' : '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_USER: ${process.env.PROJURIS_USER || '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_PASSWORD: ${process.env.PROJURIS_PASSWORD ? '***' : '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_DOMAIN: ${process.env.PROJURIS_DOMAIN || '❌ NÃO CONFIGURADA'}`);
console.log(`   PROJURIS_API_URL: ${process.env.PROJURIS_API_URL || '❌ NÃO CONFIGURADA'}`);
console.log('');

async function testarAutenticacao() {
  try {
    const tokenUrl = process.env.PROJURIS_TOKEN_URL;
    const clientId = process.env.PROJURIS_CLIENT_ID;
    const clientSecret = process.env.PROJURIS_CLIENT_SECRET;
    const username = process.env.PROJURIS_USER;
    const password = process.env.PROJURIS_PASSWORD;
    const domain = process.env.PROJURIS_DOMAIN;

    // Validação
    if (!tokenUrl || !clientId || !clientSecret || !username || !password || !domain) {
      console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
      console.error('   Crie um arquivo .env na raiz do projeto com as credenciais.\n');
      process.exit(1);
    }

    console.log('🔐 Tentando autenticar...\n');

    // Prepara credenciais
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('📤 Enviando requisição para:', tokenUrl);
    console.log('   Grant Type: password');
    console.log('   Username:', username);
    console.log('   Domain:', domain);
    console.log('');

    // Faz requisição
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
        domain: domain
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        timeout: 30000
      }
    );

    console.log('✅ AUTENTICAÇÃO BEM-SUCEDIDA!\n');
    console.log('📥 Resposta da API:');
    console.log('   Status:', response.status);
    console.log('   Access Token:', response.data.access_token ? response.data.access_token.substring(0, 50) + '...' : 'N/A');
    console.log('   Token Type:', response.data.token_type || 'N/A');
    console.log('   Expires In:', response.data.expires_in || 'N/A');
    console.log('');

    // Testa API de tarefas
    console.log('🔄 Testando endpoint de tarefas...\n');

    const apiUrl = process.env.PROJURIS_API_URL;
    const token = response.data.access_token;

    try {
      const tarefasResponse = await axios.get(
        `${apiUrl}/tarefa`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ ENDPOINT DE TAREFAS OK!');
      console.log('   Status:', tarefasResponse.status);
      console.log('   Tarefas encontradas:', Array.isArray(tarefasResponse.data) ? tarefasResponse.data.length : 'N/A');
      console.log('');
    } catch (error) {
      console.log('⚠️  Erro ao buscar tarefas (pode ser normal):');
      console.log('   Status:', error.response?.status || 'N/A');
      console.log('   Mensagem:', error.response?.data?.message || error.message);
      console.log('');
    }

    console.log('================================================');
    console.log('   ✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('   As credenciais estão corretas.');
    console.log('================================================\n');

  } catch (error) {
    console.error('❌ ERRO NA AUTENTICAÇÃO!\n');

    if (error.response) {
      console.error('📥 Resposta da API:');
      console.error('   Status:', error.response.status);
      console.error('   Mensagem:', error.response.data?.error_description || error.response.data?.message || 'N/A');
      console.error('   Dados:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📤 Nenhuma resposta recebida da API');
      console.error('   Possíveis causas:');
      console.error('   - Sem conexão com internet');
      console.error('   - URL incorreta');
      console.error('   - Firewall bloqueando');
    } else {
      console.error('⚙️  Erro ao configurar requisição:');
      console.error('   Mensagem:', error.message);
    }

    console.error('\n================================================');
    console.error('   ❌ TESTE FALHOU!');
    console.error('================================================\n');

    process.exit(1);
  }
}

// Executa teste
testarAutenticacao();
