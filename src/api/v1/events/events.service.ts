import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection } from "typeorm";
import { EventEntity } from "../../../entity/EventEntity";
import {
    Ticket,
    TICKET_STATUS_AVAILABLE,
    TICKET_STATUS_RESERVED,
    TICKET_STATUS_SOLD,
} from "../../../entity/Ticket";
import { TicketType } from "../../../entity/TicketType";

export interface EventWithTicketCounts {
    id: number;
    name: string;
    startDateTime: number; // unix timestamp
    availableTicketsCount: number;
}

export interface EventWithTicketTypesAndTickets {
    event: {
        id: number;
        name: string;
        startDateTime: number;
    };
    ticketTypes: TicketTypeDetails[];
}

interface TicketTypeDetails {
    ticketType: TicketType;
    ticketCounts: TicketCountsForTicketType;
    availableTicketIds: number[];
}

interface TicketCountsForTicketType {
    id: number;
    availableTicketCount: number;
    reservedTicketCount: number;
    soldTicketCount: number;
}

@Injectable()
export class EventsService {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    async getAllEvents(): Promise<EventWithTicketCounts[]> {
        // FIXME REFACTORING: custom repository? EventEntity
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

    async getEventDetails(id: number) {
        // FIXME REFACTORING: custom repository? EventEntity
        const eventRepository = this.databaseConnection.getRepository(EventEntity);

        // Find Event
        const event: EventEntity | undefined = await eventRepository.findOne(id, {
            relations: ["ticketTypes"],
        });

        if (event === undefined) {
            throw new NotFoundException(`Event not found`);
        }

        // Collect TicketTypes
        const ticketTypeDetailsMap: Map<number, TicketTypeDetails> = new Map();

        event.ticketTypes.forEach(tt => {
            const ticketTypeDetails: TicketTypeDetails = {
                ticketType: tt,
                ticketCounts: {
                    id: tt.id,
                    availableTicketCount: 0,
                    reservedTicketCount: 0,
                    soldTicketCount: 0,
                },
                availableTicketIds: [],
            };
            ticketTypeDetailsMap.set(tt.id, ticketTypeDetails);
        });

        // Count Tickets for each TicketType by Ticket.status
        // TODO Uses corelated subqueries, may need optimization: fetch all TicketTypes and then just counts + merge results
        const ticketTypesWithTicketCounts: TicketCountsForTicketType[] = await eventRepository.query(
            `SELECT tt.id,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS availableTicketCount,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS reservedTicketCount,
                        (SELECT COUNT(*) FROM ticket WHERE ticket.ticketTypeId = tt.id AND ticket.status = ?) AS soldTicketCount

                 FROM ticket_type tt
                 WHERE tt.eventId = ?;`,
            [TICKET_STATUS_AVAILABLE, TICKET_STATUS_RESERVED, TICKET_STATUS_SOLD, event.id],
        );

        ticketTypesWithTicketCounts.forEach(ttwtc => {
            const ticketTypeDetails = ticketTypeDetailsMap.get(ttwtc.id);
            if (ticketTypeDetails) {
                ticketTypeDetails.ticketCounts = { ...ttwtc };
            }
        });

        // Find available Tickets for each TicketType
        const ticketTypeIds = event.ticketTypes.map(tt => {
            return tt.id;
        });
        const ticketsForTicketTypes: Ticket[] = await this.databaseConnection
            .createQueryBuilder(Ticket, "ticket")
            .where("ticketTypeId IN (:...ids)", { ids: ticketTypeIds })
            .andWhere("status = :status", { status: TICKET_STATUS_AVAILABLE })
            .innerJoinAndSelect("ticket.ticketType", "tt", "tt.id = ticket.ticketTypeId")
            .getMany();

        ticketsForTicketTypes.forEach(t => {
            const ticketTypeDetails = ticketTypeDetailsMap.get(t.ticketType.id);
            if (ticketTypeDetails) {
                ticketTypeDetails.availableTicketIds.push(t.id);
            }
        });

        return {
            event: {
                id: event.id,
                name: event.name,
                // TODO format date time: event.startDateTime
                startDateTime: event.startDateTime,
            },
            ticketTypes: Array.from(ticketTypeDetailsMap.values()),
        };
    }
}
