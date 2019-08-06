import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection } from "typeorm";
import { EventEntity } from "../../../entity/EventEntity";
import { Ticket, TICKET_STATUS_AVAILABLE } from "../../../entity/Ticket";
import { TicketType } from "../../../entity/TicketType";
import { EventEntityRepository, EventWithTicketCounts } from "./EventEntityRepository";
import { TicketCountsGroupedByTicketType, TicketRepository } from "../ticket/TicketRepository";

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
    ticketCounts: TicketCountsGroupedByTicketType;
    availableTicketIds: number[];
}

@Injectable()
export class EventsService {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    async getAllEvents(): Promise<EventWithTicketCounts[]> {
        // FIXME REFACTORING: custom repository? EventEntity
        const eventRepository = this.databaseConnection.getCustomRepository(EventEntityRepository);

        const now = Date.now();

        const eventWithTicketCounts: EventWithTicketCounts[] = await eventRepository.getEventWithTicketCounts(
            now,
        );
        // TODO format date time: event.startDateTime
        return eventWithTicketCounts;
    }

    async getEventDetails(id: number) {
        const eventRepository = this.databaseConnection.getCustomRepository(EventEntityRepository);

        const event: EventEntity | undefined = await eventRepository.findOneJoinTicketTypes(id);

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
        const ticketTypesWithTicketCounts: TicketCountsGroupedByTicketType[] = await this.databaseConnection
            .getCustomRepository(TicketRepository)
            .getTicketCountsForEventGroupedByTicketType(event);

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
