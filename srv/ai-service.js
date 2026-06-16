const axios = require('axios');

class AIService {

  static async enrich(text) {

    // Replace with real AI endpoint
    const endpoint = process.env.AI_ENDPOINT || 'https://mock-ai';

    try {
      // MOCK fallback (recommended for PoC)
      if (endpoint === 'https://mock-ai') {
        return {
          summary: `Summary of: ${text}`,
          supplierRisk: 'LOW',
          materialGroup: 'IT Equipment',
          confidence: 0.87
        };
      }

      const response = await axios.post(endpoint, {
        input: text
      });

      return response.data;

    } catch (e) {
      console.error('AI error', e);
      return {
        summary: 'AI unavailable',
        supplierRisk: 'UNKNOWN'
      };
    }
  }
}

module.exports = AIService;