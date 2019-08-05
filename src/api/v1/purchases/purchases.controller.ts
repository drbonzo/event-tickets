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
                const ticketsToReserve = await this.findTicketsForReservation(
                    transactionalEntityManager,
                    Array.isArray(createPurchaseDto.ticketIds)
                        ? createPurchaseDto.ticketIds
                        : [createPurchaseDto.ticketIds],
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
}
