class AIService {

  static _getConfig() {
    const endpoint = process.env.AI_ENDPOINT;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    return { endpoint, apiKey, model };
  }

  static async enrich(request) {
    const { endpoint, apiKey, model } = AIService._getConfig();

    // Локально без endpoint → mock
    if (!endpoint || endpoint === 'https://mock-ai') {
      console.log('[AIService] Using mock enrichment');
      return AIService._mockEnrich(request);
    }

    try {
      console.log(`[AIService] Calling: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a procurement expert. Return JSON only, no markdown.'
            },
            {
              role: 'user',
              content: AIService._buildPrompt(request)
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);

    } catch (e) {
      console.error('[AIService] Failed:', e.message);
      return AIService._fallback();
    }
  }
  static _buildPrompt(request) {
    return `
Analyze this sourcing request and return a JSON object:

Title: ${request.title}
Description: ${request.description || 'N/A'}
Priority: ${request.priority}
Items: ${request.items?.length || 0} line items
Total Value: ${request.totalValue || 'unknown'} ${request.currency || 'EUR'}

Return JSON with these fields:
{
  "summary": "2-3 sentence executive summary",
  "supplierRisk": "LOW|MEDIUM|HIGH",
  "riskReasons": ["reason1", "reason2"],
  "recommendedMaterialGroup": "category name",
  "suggestedSupplierCriteria": ["criterion1", "criterion2"],
  "estimatedLeadTimeDays": number,
  "confidence": 0.0-1.0,
  "flags": ["any concerns or notes"]
}`;
  }

  static _mockEnrich(request) {
    const value = request.totalValue || 0;

    // Визначаємо ризик на основі суми
    let risk = 'LOW';
    if (value > 100000) risk = 'HIGH';
    else if (value > 10000) risk = 'MEDIUM';

    return {
      summary: `Sourcing request "${request.title}" requires procurement of ${request.items?.length || 1
        } item(s). Priority is ${request.priority?.toLowerCase() || 'medium'}. ` +
        `Estimated value: ${value} ${request.currency || 'EUR'}.`,
      supplierRisk: risk,
      riskReasons: risk === 'HIGH'
        ? ['High contract value', 'Requires additional approval']
        : ['Standard procurement', 'Known category'],
      recommendedMaterialGroup: 'IT Equipment & Services',
      suggestedSupplierCriteria: [
        'ISO 9001 certified',
        'Minimum 3 years experience',
        'Local presence preferred'
      ],
      estimatedLeadTimeDays: 14,
      confidence: 0.85,
      flags: value > 50000 ? ['Requires CFO approval'] : []
    };
  }

  static _fallback() {
    return {
      summary: 'AI enrichment unavailable. Manual review required.',
      supplierRisk: 'UNKNOWN',
      riskReasons: ['AI service unreachable'],
      confidence: 0,
      flags: ['Manual review needed']
    };
  }
}

module.exports = AIService;