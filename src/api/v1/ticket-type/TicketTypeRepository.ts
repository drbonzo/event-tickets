import { AbstractRepository } from "typeorm";
import { TicketType } from "../../../entity/TicketType";

export class TicketTypeRepository extends AbstractRepository<TicketType> {
    async save(newTicketType: TicketType): Promise<TicketType> {
        return await this.repository.save(newTicketType);
    }
}
