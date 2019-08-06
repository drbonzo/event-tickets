import { AbstractRepository } from "typeorm";
import { Purchase } from "../../../entity/Purchase";

export class PurchaseRepository extends AbstractRepository<Purchase> {
    // FIXME this could be optimized:
    // TODO for Sorting - use QueryBuilder
    async findPurchaseWithTicketAndTicketTypeAndEvent(id: number): Promise<Purchase | undefined> {
        return await this.repository.findOne(id, {
            relations: ["tickets", "tickets.ticketType", "tickets.ticketType.event"],
        });
    }
}
