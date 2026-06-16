namespace sourcing;

using {
  cuid,
  managed
} from '@sap/cds/common';

entity SourcingRequest : cuid {
      source      : String;
      description : String;
      status      : String;
}

entity Supplier : cuid {
  key ID   : UUID;
      name : String;
      risk : String;
}

entity Material : cuid {
      name  : String;
      group : String;
}

entity SourcingRequestItem : cuid {
      sourcingRequestID : UUID;
      materialID        : UUID;
      quantity          : Integer;
      supplierID        : UUID;
}


entity Documents : cuid, managed {
  fileName   : String(255) @mandatory;
  fileType   : String(10)  @mandatory;
  fileSize   : Integer;
  status     : String(20) default 'UPLOADED';
  chunkCount : Integer default 0;
  errorMsg   : String(1000);
  chunks     : Composition of many DocumentChunks
                 on chunks.document = $self;
}

entity DocumentChunks : cuid {
  document   : Association to Documents @mandatory;
  content    : LargeString              @mandatory;
  chunkIndex : Integer                  @mandatory;
  tokenCount : Integer;
  embedding  : Vector(3072);
}

entity ChatSessions : cuid, managed {
  title    : String(200);
  document : Association to Documents; // Link session to document
  messages : Composition of many ChatMessages
               on messages.session = $self;
}

entity ChatMessages : cuid {
  session   : Association to ChatSessions @mandatory;
  role      : String(20)                  @mandatory;
  content   : LargeString                 @mandatory;
  timestamp : Timestamp                   @cds.on.insert: $now;
  sources   : LargeString;
}
