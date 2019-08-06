import { AbstractRepository } from "typeorm";
import {
    Ticket,
    TICKET_STATUS_AVAILABLE,
    TICKET_STATUS_RESERVED,
    TICKET_STATUS_SOLD,
} from "../../../entity/Ticket";
import { TicketType } from "../../../entity/TicketType";
import { EventEntity } from "../../../entity/EventEntity";

export interface TicketCountsGroupedByTicketType {
    id: number;
    availableTicketCount: number;
    reservedTicketCount: number;
    soldTicketCount: number;
}

export class TicketRepository extends AbstractRepository<Ticket> {
    async save(newTicket: Ticket): Promise<Ticket> {
        return await this.repository.save(newTicket);
    }

    async getTicketCountsForEventGroupedByTicketType(
        event: EventEntity,
    ): Promise<TicketCountsGroupedByTicketType[]> {
        // TODO Uses corelated subqueries, may need optimization: fetch all TicketTypes and then just counts + merge results
        const ticketTypesWithTicketCounts: TicketCountsGroupedByTicketType[] = await this.repository.query(
            `SELECT tt.id,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS availableTicketCount,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS reservedTicketCount,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS soldTicketCount

                 FROM ticket_type tt
                 WHERE tt.eventId = ?;`,
            [TICKET_STATUS_AVAILABLE, TICKET_STATUS_RESERVED, TICKET_STATUS_SOLD, event.id],
        );

        return ticketTypesWithTicketCounts;
    }

    async countAvailableTicketsForTicketType(ticketType: TicketType): Promise<number> {
        const result: Array<{
            availableTicketCount: number;
        }> = await this.repository.query(
            `SELECT COUNT(*) AS availableTicketCount
                     FROM ticket
                     WHERE ticket.ticketTypeId = ?
                       AND ticket.status = ? `,
            [ticketType.id, TICKET_STATUS_AVAILABLE],
        );

        return result[0].availableTicketCount;
    }

    async findTicketsByIdsWithTicketTypeAndWithEvent(ticketIds: number[]): Promise<Ticket[]> {
        const tickets: Ticket[] = await this.repository
            .createQueryBuilder("ticket")
            .where("ticket.id IN (:...ids)", { ids: ticketIds })
            .andWhere("ticket.status = :ticketStatus", { ticketStatus: TICKET_STATUS_AVAILABLE })
            .innerJoinAndSelect("ticket.ticketType", "ticketType")
            // FIXME add Ticket.event property? to get rid of this join?
            .innerJoinAndSelect("ticketType.event", "eventEntity")
            .getMany();

        return tickets;
    }
}
