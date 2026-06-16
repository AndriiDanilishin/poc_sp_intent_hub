using {
    sourcing.SourcingRequest,
    sourcing.Supplier,
    sourcing.Material
} from '../db/schema';

service SourcingService {

    entity Requests  as projection on SourcingRequest;
    entity Suppliers as projection on Supplier;
    entity Materials as projection on Material;

    action enrichWithAI(
        requestID : UUID
    ) returns String;

    action createProject(
        requestID : UUID
    ) returns String;

}
