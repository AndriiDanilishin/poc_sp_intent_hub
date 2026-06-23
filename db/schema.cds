namespace sourcing;

using {
  cuid,
  managed
} from '@sap/cds/common';


//########################## FirstApp Sourcing ########################## 
entity Supplier : cuid, managed {
  name          : String(200) not null;
  email         : String(100);
  country       : String(3);   // ISO code: POL, DEU, USA
  risk          : String enum { LOW; MEDIUM; HIGH } default 'LOW';
  rating        : Decimal(3,2); // 0.00 - 5.00
  isActive      : Boolean default true;
  items         : Composition of many SourcingRequestItem
                    on items.supplier = $self;
}

entity Material : cuid, managed {
  name          : String(200) not null;
  group         : String(100);
  unit          : String(10) default 'EA'; // EA, KG, L
  estimatedPrice: Decimal(15,2);
  currency      : String(3) default 'EUR';
  items         : Composition of many SourcingRequestItem
                    on items.material = $self;
}

// ─── Header ───
entity SourcingRequest : cuid, managed {
  title         : String(200) not null;
  description   : String(2000);
  source        : String enum { MANUAL; EMAIL; API } default 'MANUAL';
  status        : String enum {
                    DRAFT;
                    SUBMITTED;
                    ENRICHED;
                    IN_REVIEW;
                    APPROVED;
                    REJECTED;
                    CREATED    // ERP project created
                  } default 'DRAFT';
  priority      : String enum { LOW; MEDIUM; HIGH; CRITICAL } default 'MEDIUM';
  requester     : String(200);
  requesterEmail: String(100);
  dueDate       : Date;
  totalValue    : Decimal(15,2);
  currency      : String(3) default 'EUR';
  erpProjectID  : String(50);  // filled after createProject
  aiSummary     : String(2000);
  aiRiskScore   : String enum { LOW; MEDIUM; HIGH };
  aiConfidence  : Decimal(4,3); // 0.000 - 1.000
  aiEnrichedAt  : Timestamp;
  items         : Composition of many SourcingRequestItem
                    on items.request = $self;
  comments      : Composition of many Comment
                    on comments.request = $self;
}

// ─── Items ───────────────────────────────────────
entity SourcingRequestItem : cuid {
  request       : Association to SourcingRequest not null;
  material      : Association to Material;
  materialName  : String(200); // вільний текст якщо матеріал не в довіднику
  quantity      : Decimal(13,3) not null default 1;
  unit          : String(10) default 'EA';
  estimatedPrice: Decimal(15,2);
  currency      : String(3) default 'EUR';
  supplier      : Association to Supplier;
  supplierName  : String(200); // вільний текст
  lineValue     : Decimal(15,2); // quantity * estimatedPrice
}

// ─── Comments / Audit ────────────────────────────────────
entity Comment : cuid, managed {
  request       : Association to SourcingRequest not null;
  text          : String(2000) not null;
  type          : String enum { COMMENT; APPROVAL; REJECTION; SYSTEM };
  author        : String(200);
}

//########################## SecondApp Documents ########################## 
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
