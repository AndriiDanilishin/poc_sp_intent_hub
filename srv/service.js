const cds = require('@sap/cds');
const AIService = require('./ai-service');

module.exports = cds.service.impl(async function () {

  const { Requests } = this.entities;

  this.on('enrichWithAI', async (req) => {
    const { requestID } = req.data;

    const request = await SELECT.one.from(Requests).where({ ID: requestID });

    if (!request) throw new Error('Request not found');

    const aiResult = await AIService.enrich(request.description);

    await UPDATE(Requests)
      .set({ status: 'ENRICHED' })
      .where({ ID: requestID });

    return JSON.stringify(aiResult);
  });

  this.on('createProject', async (req) => {
    const { requestID } = req.data;

    // Mock ERP call
    const projectId = 'ERP-' + Math.floor(Math.random() * 100000);

    await UPDATE(Requests)
      .set({ status: 'CREATED' })
      .where({ ID: requestID });

    return projectId;
  });

});
