const axios = require('axios');
const NodeCache = require('node-cache');

// Cache para armazenar o token (válido por 55 minutos)
const tokenCache = new NodeCache({ stdTTL: 3300 });

class ProjurisAuth {
  constructor() {
    this.tokenUrl = process.env.PROJURIS_TOKEN_URL;
    this.clientId = process.env.PROJURIS_CLIENT_ID;
    this.clientSecret = process.env.PROJURIS_CLIENT_SECRET;
    this.domain = process.env.PROJURIS_DOMAIN;
    this.username = process.env.PROJURIS_USER;
    this.password = process.env.PROJURIS_PASSWORD;
  }

  /**
   * Obtém o token de acesso (busca do cache ou renova se expirado)
   */
  async getAccessToken() {
    try {
      // Verifica se existe token válido no cache
      const cachedToken = tokenCache.get('access_token');
      if (cachedToken) {
        console.log('✓ Token encontrado no cache');
        return cachedToken;
      }

      console.log('→ Solicitando novo token de acesso...');

      // Validação das variáveis de ambiente
      const requiredVars = {
        'PROJURIS_TOKEN_URL': this.tokenUrl,
        'PROJURIS_CLIENT_ID': this.clientId,
        'PROJURIS_CLIENT_SECRET': this.clientSecret,
        'PROJURIS_USER': this.username,
        'PROJURIS_PASSWORD': this.password,
        'PROJURIS_DOMAIN': this.domain
      };

      const missingVars = Object.entries(requiredVars)
        .filter(([key, value]) => !value || value === 'undefined')
        .map(([key]) => key);

      if (missingVars.length > 0) {
        throw new Error(`Variáveis de ambiente não configuradas: ${missingVars.join(', ')}`);
      }

      // Log das configurações (sem mostrar senha)
      console.log('Configurações de autenticação:');
      console.log(`  Token URL: ${this.tokenUrl}`);
      console.log(`  Client ID: ${this.clientId}`);
      console.log(`  Username: ${this.username}`);
      console.log(`  Domain: ${this.domain}`);

      // Prepara as credenciais em Base64 para autenticação básica
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      // Requisição OAuth2 com grant_type password
      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password,
          domain: this.domain
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      const accessToken = response.data.access_token;

      if (!accessToken) {
        throw new Error('Token não encontrado na resposta da API');
      }

      // Armazena no cache
      tokenCache.set('access_token', accessToken);
      console.log('✓ Novo token obtido e armazenado no cache');

      return accessToken;
    } catch (error) {
      console.error('✗ Erro ao obter token:', error.response?.data || error.message);

      // Log detalhado do erro
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', error.response.data);
      } else if (error.request) {
        console.error('  Nenhuma resposta recebida da API');
        console.error('  Request:', error.request);
      } else {
        console.error('  Erro:', error.message);
      }

      throw new Error(`Falha na autenticação: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Limpa o cache do token (útil para forçar renovação)
   */
  clearTokenCache() {
    tokenCache.del('access_token');
    console.log('✓ Cache de token limpo');
  }

  /**
   * Verifica se o token está válido
   */
  hasValidToken() {
    return tokenCache.has('access_token');
  }
}

module.exports = new ProjurisAuth();
