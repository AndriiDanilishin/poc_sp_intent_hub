using {
    sourcing.SourcingRequest,
    sourcing.Supplier,
    sourcing.Material,
    sourcing.SourcingRequestItem,
    sourcing.Comment
} from '../db/schema';

service SourcingService @(path: '/sourcing') {

    // ─── Entities ────────────────────────────────────────── 
    @odata.draft.enabled
    entity Requests         as projection on SourcingRequest
        actions {
            action enrichWithAI()                  returns String;
            action submitRequest()                 returns String;
            action approveRequest(comment: String) returns String;
            action rejectRequest(reason: String)   returns String;
            action createProject()                 returns String;
        };

    entity Suppliers        as projection on Supplier
                               where
                                   isActive = true;

    entity Materials        as projection on Material;
    entity Items            as projection on SourcingRequestItem;
    entity Comments         as projection on Comment;

    // ─── Read-only view ────────────────────────────────────
    @readonly
    @cds.redirection.target: false
    entity RequestsOverview as
        select from SourcingRequest {
            ID,
            title,
            status,
            priority,
            requester,
            dueDate,
            totalValue,
            currency,
            erpProjectID,
            aiRiskScore,
            createdAt,
            modifiedAt
        };
}
