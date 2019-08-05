import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Post,
} from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection, EntityManager } from "typeorm";
import { Purchase, PURCHASE_STATUS_WAITS_FOR_PAYMENT } from "../../../entity/Purchase";
import { Ticket, TICKET_STATUS_AVAILABLE, TICKET_STATUS_RESERVED } from "../../../entity/Ticket";
import { CreatePurchaseDTO } from "./dto";
import { Customer } from "../../../entity/Customer";
import { EventEntity } from "../../../entity/EventEntity";
import {
    SELLING_OPTION_ALL_TOGETHER,
    SELLING_OPTION_AVOID_ONE,
    SELLING_OPTION_EVEN,
    TicketType,
} from "../../../entity/TicketType";

const EXPIRE_PURCHASE_AFTER_SECONDS = 15 * 60;

interface PurchaseDetails {
    purchase: {
        id: number;
        status: string;
        totalPrice: number;
    };
    ticketData: Array<{
        id: number;
        number: string;
        price: number;
        typeName: string;
        eventName: string;
    }>;
}

@Controller("/api/v1/purchases")
export class PurchasesController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Post("/")
    public async reserveTickets(
        @Body() createPurchaseDto: CreatePurchaseDTO,
    ): Promise<PurchaseDetails> {
        const purchase: Purchase = await this.databaseConnection.transaction(
            "SERIALIZABLE",
            async (transactionalEntityManager: EntityManager) => {
                const newPurchase = new Purchase();
                newPurchase.tickets = [];

                // FIXME handle duplicated ticket ids?

                // FIXME add authorization for this
                const customer:
                    | Customer
                    | undefined = await transactionalEntityManager
                    .getRepository(Customer)
                    .findOne(createPurchaseDto.customerId);

                if (customer == null) {
                    throw new BadRequestException("Customer does not exist");
                }

                newPurchase.customer = customer;
                newPurchase.expiresAfter = Date.now() + EXPIRE_PURCHASE_AFTER_SECONDS; // FIXME DRY expiresAt
                newPurchase.status = PURCHASE_STATUS_WAITS_FOR_PAYMENT;
                newPurchase.totalPrice = 0;

                // Find tickets
                const ticketIds: number[] = Array.isArray(createPurchaseDto.ticketIds)
                    ? createPurchaseDto.ticketIds
                    : [createPurchaseDto.ticketIds];
                const ticketsToReserve = await this.findTicketsForReservation(
                    transactionalEntityManager,
                    ticketIds,
                );

                await this.checkSellingOptionsForTickets(
                    ticketsToReserve,
                    transactionalEntityManager,
                );

                // Connect them with Purchase (Reservation)
                let totalPriceToPay = 0;
                ticketsToReserve.forEach(ticket => {
                    totalPriceToPay += ticket.price;
                    ticket.status = TICKET_STATUS_RESERVED;
                });

                newPurchase.tickets = ticketsToReserve;
                newPurchase.totalPrice = totalPriceToPay;

                await transactionalEntityManager.save(newPurchase);

                return newPurchase;
            },
        );

        return this.buildPurchaseDetails(purchase);
    }

    @Get("/:id")
    public async getPurchaseStatus(@Param("id") id: number): Promise<PurchaseDetails> {
        const purchaseRepository = this.databaseConnection.getRepository(Purchase);
        // FIXME this could be optimized:
        // TODO for Sorting - use QueryBuilder
        const purchase: Purchase | undefined = await purchaseRepository.findOne(id, {
            relations: ["tickets", "tickets.ticketType", "tickets.ticketType.event"],
        });

        if (purchase === undefined) {
            throw new NotFoundException(`Purchase not found`);
        }

        return this.buildPurchaseDetails(purchase);
    }

    private buildPurchaseDetails(purchase: Purchase): PurchaseDetails {
        // FIXME DRY
        const purchaseDetails: PurchaseDetails = {
            purchase: {
                id: purchase.id,
                status: purchase.status,
                totalPrice: purchase.totalPrice,
            },
            ticketData: purchase.tickets.map((ticket: Ticket) => {
                return {
                    id: ticket.id,
                    number: ticket.number,
                    price: ticket.price,
                    typeName: ticket.ticketType.name,
                    eventName: ticket.ticketType.event.name,
                };
            }),
        };

        return purchaseDetails;
    }

    private async findTicketsForReservation(
        entityManager: EntityManager,
        ticketIds: number[],
    ): Promise<Ticket[]> {
        if (ticketIds.length === 0) {
            throw new BadRequestException("You must reserve at least 1 ticket");
        }

        const tickets: Ticket[] = await entityManager
            .createQueryBuilder(Ticket, "ticket")
            .where("ticket.id IN (:...ids)", { ids: ticketIds })
            .andWhere("ticket.status = :ticketStatus", { ticketStatus: TICKET_STATUS_AVAILABLE })
            .innerJoinAndSelect("ticket.ticketType", "ticketType")
            // FIXME add Ticket.event property? to get rid of this join?
            .innerJoinAndSelect("ticketType.event", "eventEntity")
            .getMany();

        if (tickets.length !== ticketIds.length) {
            throw new BadRequestException(
                "Cannot reserve these tickets. Some of them are unavailable",
            );
        }

        // Tickets must be from the same Event
        let eventId: number | undefined;
        tickets.forEach(ticket => {
            if (eventId === undefined) {
                eventId = ticket.ticketType.event.id;
            }

            if (eventId !== ticket.ticketType.event.id) {
                throw new BadRequestException("Tickets must be from the same Event");
            }
        });

        // Check if Event starts in the future
        if (eventId) {
            const event = await this.databaseConnection.getRepository(EventEntity).findOne(eventId);
            if (!event) {
                throw new InternalServerErrorException("Event not found? id=" + eventId);
            }

            if (!event.startsInFutureFrom(Date.now())) {
                throw new BadRequestException("Cannot reserve Tickets for past Events");
            }
        } else {
            throw new InternalServerErrorException("eventId should not be undefined");
        }

        // FIXME add additional validations for reservation
        return tickets;
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
                    await this.validateSellingOptionEven(ticketType, tickets, entityManager);
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
        entityManager: EntityManager, // FIXME remove?
    ): Promise<void> {
        const reservingEvenTickets = tickets.length % 2 === 0;
        if (!reservingEvenTickets) {
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
            throw new BadRequestException(
                "You must not leave 1 ticket left of type: " + ticketType.name,
            );
        }
    }

    private async countAvailableTicketsForTicketType(
        ticketType: TicketType,
        entityManager: EntityManager,
    ): Promise<number> {
        const result: Array<{
            availableTicketCount: number;
        }> = await entityManager.getRepository(Ticket).query(
            `SELECT COUNT(*) AS availableTicketCount
                     FROM ticket
                     WHERE ticket.ticketTypeId = ?
                       AND ticket.status = ? `,
            [ticketType.id, TICKET_STATUS_AVAILABLE],
        );

        return result[0].availableTicketCount;
    }
}
