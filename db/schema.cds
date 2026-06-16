namespace sourcing;

entity SourcingRequest {
  key ID          : UUID;
      source      : String;
      description : String;
      status      : String;
}

entity Supplier {
  key ID   : UUID;
      name : String;
      risk : String;
}

entity Material {
  key ID   : UUID;
      name : String;
      group: String;
}
entity SourcingRequestItem {
  key ID              : UUID;
      sourcingRequestID : UUID;
      materialID       : UUID;
      quantity         : Integer;
      supplierID       : UUID;
}