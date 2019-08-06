import { Inject, Injectable } from "@nestjs/common";
import { Purchase, PURCHASE_STATUS_WAITS_FOR_PAYMENT } from "../../../entity/Purchase";
import { Customer } from "../../../entity/Customer";
import { Ticket, TICKET_STATUS_RESERVED } from "../../../entity/Ticket";
import { Connection, EntityManager } from "typeorm";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { PurchaseValidatorService } from "../purchases/purchase-validator/purchase-validator.service";
import { TicketService } from "../ticket/ticket.service";

const EXPIRE_PURCHASE_AFTER_SECONDS = 15 * 60;

export interface PurchaseDetails {
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

@Injectable()
export class PurchaseService {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly databaseConnection: Connection,
        private readonly purchaseValidatorService: PurchaseValidatorService,
        private readonly ticketService: TicketService,
    ) {}

    buildNewPurchase(customer: Customer): Purchase {
        const purchase = new Purchase();
        purchase.tickets = [];
        purchase.customer = customer;
        purchase.expiresAfter = Date.now() + EXPIRE_PURCHASE_AFTER_SECONDS; // FIXME DRY expiresAt
        purchase.status = PURCHASE_STATUS_WAITS_FOR_PAYMENT;
        purchase.totalPrice = 0;
        return purchase;
    }

    addTicketsToPurchase(purchase: Purchase, ticketsToReserve: Ticket[]) {
        // Connect them with Purchase (Reservation)
        let totalPriceToPay = 0;
        ticketsToReserve.forEach(ticket => {
            totalPriceToPay += ticket.price;
            ticket.status = TICKET_STATUS_RESERVED;
        });

        purchase.tickets = ticketsToReserve;
        purchase.totalPrice = totalPriceToPay;
    }

    async findPurchase(id: number): Promise<Purchase | undefined> {
        const purchaseRepository = this.databaseConnection.getRepository(Purchase);
        // FIXME this could be optimized:
        // TODO for Sorting - use QueryBuilder
        const purchase: Purchase | undefined = await purchaseRepository.findOne(id, {
            relations: ["tickets", "tickets.ticketType", "tickets.ticketType.event"],
        });

        return purchase;
    }

    public buildPurchaseDetails(purchase: Purchase): PurchaseDetails {
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

    public async reserveTicketsWithEntityManager(
        customer: Customer,
        ticketIds: number[],
        entityManager: EntityManager,
    ): Promise<Purchase> {
        const newPurchase = this.buildNewPurchase(customer);

        // Find tickets
        const ticketsToReserve = await this.ticketService.findTicketsWithEntityManager(
            ticketIds,
            entityManager,
        );

        const eventIdsFromTickets: number[] = ticketsToReserve.map(ticket => {
            return ticket.ticketType.event.id;
        });

        await this.purchaseValidatorService.validateTicketsForNewReservationWithEntityManager(
            ticketsToReserve,
            ticketIds,
            eventIdsFromTickets,
            entityManager,
        );

        this.addTicketsToPurchase(newPurchase, ticketsToReserve);

        await entityManager.save(newPurchase);

        return newPurchase;
    }
}
