import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection } from "typeorm";
import { EventEntity } from "../../../entity/EventEntity";
import {
    TICKET_STATUS_AVAILABLE,
    TICKET_STATUS_RESERVED,
    TICKET_STATUS_SOLD,
} from "../../../entity/Ticket";

interface EventWithTicketCounts {
    id: number;
    name: string;
    startDateTime: number; // unix timestamp
    availableTicketsCount: number;
}

interface TicketTypeWithTicketCounts {
    id: number;
    name: string;
    price: number;
    sellingOption: string;
    availableTicketCount: number;
    reservedTicketCount: number;
    soldTicketCount: number;
}

interface EventWithDetails {
    event: EventEntity;
    ticketTypes: TicketTypeWithTicketCounts[];
}

@Controller("/api/v1/events")
export class EventsController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Get("")
    public async getAllEvents(): Promise<EventWithTicketCounts[]> {
        const eventRepository = this.databaseConnection.getRepository(EventEntity);

        const now = Date.now();

        // TODO Uses corelated subquery - fetch all Events and then do separate count of Tickets + merge results
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

    @Get("/:id")
    public async getEventDetails(@Param("id") id: number): Promise<EventWithDetails> {
        const eventRepository = this.databaseConnection.getRepository(EventEntity);

        const event: EventEntity | undefined = await eventRepository.findOne(id);

        if (event === undefined) {
            throw new NotFoundException(`Event not found`);
        }

        // TODO Uses corelated subqueries, may need optimization: fetch all TicketTypes and then just counts + merge results
        const ticketTypesWithTicketCounts: TicketTypeWithTicketCounts[] = await eventRepository.query(
            `SELECT tt.*,
       (SELECT COUNT( *) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS availableTicketCount,
       (SELECT COUNT( *) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS reservedTicketCount,
       (SELECT COUNT( *) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS soldTicketCount

FROM ticket_type tt
WHERE tt.eventId = ?;`,
            [TICKET_STATUS_AVAILABLE, TICKET_STATUS_RESERVED, TICKET_STATUS_SOLD, event.id],
        );

        return {
            // TODO format date time: event.startDateTime
            event: event,
            ticketTypes: ticketTypesWithTicketCounts,
        };
    }
}
