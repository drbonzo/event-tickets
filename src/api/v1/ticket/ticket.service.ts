import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { Ticket, TICKET_STATUS_AVAILABLE } from "../../../entity/Ticket";

@Injectable()
export class TicketService {
    async findTickets(ticketIds: number[], entityManager: EntityManager): Promise<Ticket[]> {
        const tickets: Ticket[] = await entityManager
            .createQueryBuilder(Ticket, "ticket")
            .where("ticket.id IN (:...ids)", { ids: ticketIds })
            .andWhere("ticket.status = :ticketStatus", { ticketStatus: TICKET_STATUS_AVAILABLE })
            .innerJoinAndSelect("ticket.ticketType", "ticketType")
            // FIXME add Ticket.event property? to get rid of this join?
            .innerJoinAndSelect("ticketType.event", "eventEntity")
            .getMany();

        return tickets;
    }
}
