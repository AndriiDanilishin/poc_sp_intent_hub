using { sourcing.Documents as SourceDocuments } from '../db/schema';

// ── Типи для відповідей функцій ─────────────────────────
type DocumentStatus {
  status     : String;
  chunkCount : Integer;
  errorMsg   : String;
}

type DeletePreview {
  sessionCount : Integer;
  messageCount : Integer;
  chunkCount   : Integer;
}

service DocumentService @(path: '/api/documents') {

  entity Documents as projection on SourceDocuments
    excluding { chunks };

  action   deleteDocument  (documentId : UUID) returns Boolean;
  function getStatus       (documentId : UUID) returns DocumentStatus;
  function getDeletePreview(documentId : UUID) returns DeletePreview;

}