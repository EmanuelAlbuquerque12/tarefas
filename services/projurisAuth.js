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
