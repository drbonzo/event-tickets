import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Ticket, TICKET_STATUS_AVAILABLE } from "../../../../entity/Ticket";
import { EntityManager } from "typeorm";
import {
    SELLING_OPTION_ALL_TOGETHER,
    SELLING_OPTION_AVOID_ONE,
    SELLING_OPTION_EVEN,
    TicketType,
} from "../../../../entity/TicketType";
import { EventEntity } from "../../../../entity/EventEntity";
import { EventEntityRepository } from "../../events/EventEntityRepository";
import { TicketRepository } from "../../ticket/TicketRepository";

@Injectable()
export class PurchaseValidatorService {
    public async validateTicketsForNewReservation(
        tickets: Ticket[],
        requestedTickedIds: number[],
        eventIdsFromTickets: number[],
        entityManager: EntityManager,
    ): Promise<void> {
        // FIXME handle duplicated ticket ids?

        if (tickets.length !== requestedTickedIds.length) {
            // TODO throw more Service-level exception
            throw new BadRequestException(
                "Cannot reserve these tickets. Some of them are unavailable",
            );
        }

        // Tickets must be from the same Event
        if (eventIdsFromTickets.length !== 1) {
            // TODO throw more Service-level exception
            throw new BadRequestException("Tickets must be from the same Event");
        }

        const eventId: number = eventIdsFromTickets[0];

        // Check if Event starts in the future
        const event = await entityManager
            .getCustomRepository(EventEntityRepository)
            .findOne(eventId);
        if (!event) {
            // TODO throw more Service-level exception
            throw new InternalServerErrorException("Event not found? id=" + eventId);
        }

        if (!event.startsInFutureFrom(Date.now())) {
            // TODO throw more Service-level exception
            throw new BadRequestException("Cannot reserve Tickets for past Events");
        }

        await this.checkSellingOptionsForTickets(tickets, entityManager);
    }

    private async checkSellingOptionsForTickets(
        ticketsToReserve: Ticket[],
        entityManager: EntityManager,
    ): Promise<void> {
        const ticketTypes: Map<number, TicketType> = new Map();
        const ticketsGroupedByType: Map<number, Ticket[]> = new Map();

        ticketsToReserve.forEach(ticket => {
            const ticketTypeId = ticket.ticketType.id;
            const tickets = ticketsGroupedByType.get(ticketTypeId) || [];
            tickets.push(ticket);
            ticketsGroupedByType.set(ticketTypeId, tickets);

            ticketTypes.set(ticketTypeId, ticket.ticketType);
        });

        // FIXME return error messages for each error

        try {
            for (const ticketType of Array.from(ticketTypes.values())) {
                const tickets = ticketsGroupedByType.get(ticketType.id) || [];
                // FIXME extract to validators
                if (ticketType.sellingOption === SELLING_OPTION_EVEN) {
                    await this.validateSellingOptionEven(ticketType, tickets);
                } else if (ticketType.sellingOption === SELLING_OPTION_ALL_TOGETHER) {
                    await this.validateSellingOptionAllTogether(ticketType, tickets, entityManager);
                } else if (ticketType.sellingOption === SELLING_OPTION_AVOID_ONE) {
                    await this.validateSellingOptionAvoidOne(ticketType, tickets, entityManager);
                }
            }
        } catch (e) {
            throw e;
        }
    }

    private async validateSellingOptionEven(
        ticketType: TicketType,
        tickets: Ticket[],
    ): Promise<void> {
        const reservingEvenTickets = tickets.length % 2 === 0;
        if (!reservingEvenTickets) {
            // TODO throw more Service-level exception
            throw new BadRequestException(
                "You must reserve even number of tickets of type: " + ticketType.name,
            );
        }
    }

    /**
     * Number of reserved Tickets must be equal to all available Tickets
     */
    private async validateSellingOptionAllTogether(
        ticketType: TicketType,
        tickets: Ticket[],
        entityManager: EntityManager,
    ) {
        const availableTicketsCount = await this.countAvailableTicketsForTicketType(
            ticketType,
            entityManager,
        );
        const notAllTicketsReserved = tickets.length !== availableTicketsCount;
        if (notAllTicketsReserved) {
            // TODO throw more Service-level exception
            throw new BadRequestException("You must but ALL tickets of type: " + ticketType.name);
        }
    }

    /**
     * Number available tickets minus number of reserved Tickets must be !== 1
     *
     * - so you can leave 2, 3, 4, ... available Tickets (> 1)
     * - or buy all available (=== 0)
     */
    private async validateSellingOptionAvoidOne(
        ticketType: TicketType,
        tickets: Ticket[],
        entityManager: EntityManager,
    ) {
        const availableTicketsCount = await this.countAvailableTicketsForTicketType(
            ticketType,
            entityManager,
        );
        const singleTicketRemains = availableTicketsCount - tickets.length === 1;
        if (singleTicketRemains) {
            // TODO throw more Service-level exception
            throw new BadRequestException(
                "You must not leave 1 ticket left of type: " + ticketType.name,
            );
        }
    }

    private async countAvailableTicketsForTicketType(
        ticketType: TicketType,
        entityManager: EntityManager,
    ): Promise<number> {
        return await entityManager
            .getCustomRepository(TicketRepository)
            .countAvailableTicketsForTicketType(ticketType);
    }
}
