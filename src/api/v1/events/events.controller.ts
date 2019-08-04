import { Controller, Get, Inject } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection } from "typeorm";
import { EventEntity } from "../../../entity/EventEntity";
import { TICKET_STATUS_AVAILABLE } from "../../../entity/Ticket";

interface EventWithTicketCounts {
    id: number;
    name: string;
    startDateTime: number; // unix timestamp
    availableTicketsCount: number;
}

@Controller("/api/v1/events")
export class EventsController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Get("")
    public async getAllEvents(): Promise<EventWithTicketCounts[]> {
        const eventRepository = this.databaseConnection.getRepository(EventEntity);

        const now = Date.now();

        // TODO Uses corelated subquery - may need optimization
        const eventWithTicketCounts: EventWithTicketCounts[] = await eventRepository.query(
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

        // TODO format date time: event.startDateTime
        return eventWithTicketCounts;
    }
}
