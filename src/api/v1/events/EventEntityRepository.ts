import { AbstractRepository, EntityRepository } from "typeorm";
import { TICKET_STATUS_AVAILABLE } from "../../../entity/Ticket";
import { EventEntity } from "../../../entity/EventEntity";

export interface EventWithTicketCounts {
    id: number;
    name: string;
    startDateTime: number; // unix timestamp
    availableTicketsCount: number;
}

@EntityRepository(EventEntity)
export class EventEntityRepository extends AbstractRepository<EventEntity> {
    async save(newEvent: EventEntity): Promise<EventEntity> {
        return await this.repository.save(newEvent);
    }

    async getEventWithTicketCounts(now: number): Promise<EventWithTicketCounts[]> {
        // TODO Uses corelated subquery - fetch all Events and then do separate count of Tickets + merge results
        const eventWithTicketCounts: EventWithTicketCounts[] = await this.repository.query(
            `SELECT event_entity.id,
                        event_entity.name,
                        event_entity.startDateTime,
                        (
                          SELECT COUNT(*)
                          FROM ticket_type tt
                                 LEFT JOIN ticket t on tt.id = t.ticketTypeId
                          WHERE tt.eventId = event_entity.id
                            and t.status = ?
                        ) as availableTicketsCount
                 FROM event_entity
                 WHERE event_entity.startDateTime > ?
                 GROUP BY event_entity.id`,
            [TICKET_STATUS_AVAILABLE, now],
        );

        return eventWithTicketCounts;
    }

    async findOneJoinTicketTypes(id: number): Promise<EventEntity | undefined> {
        return await this.repository.findOne(id, {
            relations: ["ticketTypes"],
        });
    }

    async findOne(id: number): Promise<EventEntity | undefined> {
        return await this.repository.findOne(id);
    }
}
