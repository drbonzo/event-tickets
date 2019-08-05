import { Inject, Injectable } from "@nestjs/common";
import { Purchase, PURCHASE_STATUS_WAITS_FOR_PAYMENT } from "../../../entity/Purchase";
import { Customer } from "../../../entity/Customer";
import { Ticket, TICKET_STATUS_RESERVED } from "../../../entity/Ticket";
import { Connection, EntityManager } from "typeorm";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";

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
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

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

    async savePurchaseWithEntityManager(purchase: Purchase, entityManager: EntityManager) {
        await entityManager.save(purchase);
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
}
