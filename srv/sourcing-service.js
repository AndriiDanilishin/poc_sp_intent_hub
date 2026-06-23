const cds = require('@sap/cds');
const AIService = require('./lib/ai-service');

module.exports = cds.service.impl(async function () {

  const { Requests, Comments, Items } = this.entities;

  // ── ENRICH WITH AI ──────────────────────────────────────
  this.on('enrichWithAI', 'Requests', async (req) => {
    const { ID } = req.params[0];

    const request = await SELECT.one.from(Requests)
      .columns('ID', 'title', 'description', 'priority',
               'totalValue', 'currency', 'status')
      .where({ ID });

    if (!request) return req.error(404, 'Request not found');

    if (request.status === 'CREATED') {
      return req.error(400, 'Cannot enrich a request that is already in ERP');
    }

    const aiResult = await AIService.enrich(request);

    await UPDATE(Requests).set({
      status:        'ENRICHED',
      aiSummary:     aiResult.summary,
      aiRiskScore:   aiResult.supplierRisk,
      aiConfidence:  aiResult.confidence,
      aiEnrichedAt:  new Date().toISOString()
    }).where({ ID });

    // Додаємо системний коментар
    await INSERT.into(Comments).entries({
      request_ID: ID,
      text: `AI Enrichment completed. Risk: ${aiResult.supplierRisk}. ` +
            `Confidence: ${Math.round(aiResult.confidence * 100)}%. ` +
            (aiResult.flags?.length ? `Flags: ${aiResult.flags.join(', ')}` : ''),
      type:   'SYSTEM',
      author: 'AI Service'
    });

    return JSON.stringify(aiResult);
  });

  // ── SUBMIT ──────────────────────────────────────────────
  this.on('submitRequest', 'Requests', async (req) => {
    const { ID } = req.params[0];

    const request = await SELECT.one.from(Requests)
      .columns('ID', 'status', 'title')
      .where({ ID });

    if (!request) return req.error(404, 'Request not found');

    if (!['DRAFT', 'ENRICHED'].includes(request.status)) {
      return req.error(400, `Cannot submit request in status: ${request.status}`);
    }

    await UPDATE(Requests)
      .set({ status: 'SUBMITTED' })
      .where({ ID });

    await INSERT.into(Comments).entries({
      request_ID: ID,
      text:   'Request submitted for review.',
      type:   'SYSTEM',
      author: req.user?.id || 'System'
    });

    return `Request "${request.title}" submitted successfully`;
  });

  // ── APPROVE ─────────────────────────────────────────────
  this.on('approveRequest', 'Requests', async (req) => {
    const { ID } = req.params[0];
    const { comment } = req.data;

    const request = await SELECT.one.from(Requests)
      .where({ ID });

    if (!request) return req.error(404, 'Request not found');

    if (request.status !== 'SUBMITTED' && request.status !== 'IN_REVIEW') {
      return req.error(400, `Cannot approve request in status: ${request.status}`);
    }

    await UPDATE(Requests)
      .set({ status: 'APPROVED' })
      .where({ ID });

    await INSERT.into(Comments).entries({
      request_ID: ID,
      text:   comment || 'Request approved.',
      type:   'APPROVAL',
      author: req.user?.id || 'Approver'
    });

    return 'Request approved successfully';
  });

  // ── REJECT ──────────────────────────────────────────────
  this.on('rejectRequest', 'Requests', async (req) => {
    const { ID } = req.params[0];
    const { reason } = req.data;

    if (!reason) return req.error(400, 'Rejection reason is required');

    await UPDATE(Requests)
      .set({ status: 'REJECTED' })
      .where({ ID });

    await INSERT.into(Comments).entries({
      request_ID: ID,
      text:   `Rejected: ${reason}`,
      type:   'REJECTION',
      author: req.user?.id || 'Approver'
    });

    return 'Request rejected';
  });

  // ── CREATE ERP PROJECT ──────────────────────────────────
  this.on('createProject', 'Requests', async (req) => {
    const { ID } = req.params[0];

    const request = await SELECT.one.from(Requests)
      .columns('ID', 'title', 'status', 'erpProjectID')
      .where({ ID });

    if (!request) return req.error(404, 'Request not found');

    if (request.status !== 'APPROVED') {
      return req.error(400, 'Only approved requests can be sent to ERP');
    }

    if (request.erpProjectID) {
      return req.error(409, `ERP project already exists: ${request.erpProjectID}`);
    }

    // TODO: замінити на реальний RFC/API виклик до S/4HANA
    const projectId = `PR-${new Date().getFullYear()}-${
      String(Math.floor(Math.random() * 99999)).padStart(5, '0')
    }`;

    await UPDATE(Requests).set({
      status:       'CREATED',
      erpProjectID: projectId
    }).where({ ID });

    await INSERT.into(Comments).entries({
      request_ID: ID,
      text:   `ERP Project created: ${projectId}`,
      type:   'SYSTEM',
      author: 'ERP Integration'
    });

    return projectId;
  });

  // ── AUTO CALCULATE LINE VALUE ───────────────────────────
  this.before(['CREATE', 'UPDATE'], 'Items', async (req) => {
    const item = req.data;
    if (item.quantity && item.estimatedPrice) {
      item.lineValue = parseFloat(
        (item.quantity * item.estimatedPrice).toFixed(2)
      );
    }
  });

  // ── AUTO CALCULATE TOTAL VALUE ──────────────────────────
  this.after(['CREATE', 'UPDATE', 'DELETE'], 'Items', async (_, req) => {
    const item = req.data;
    const requestId = item?.request_ID;
    if (!requestId) return;

    const items = await SELECT.from(Items)
      .columns('lineValue')
      .where({ request_ID: requestId });

    const total = items.reduce((sum, i) => sum + (i.lineValue || 0), 0);

    await UPDATE(Requests)
      .set({ totalValue: parseFloat(total.toFixed(2)) })
      .where({ ID: requestId });
  });

});