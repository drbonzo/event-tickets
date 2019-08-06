import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { Purchase, PURCHASE_STATUS_WAITS_FOR_PAYMENT } from "../../../entity/Purchase";
import { Customer } from "../../../entity/Customer";
import { Ticket, TICKET_STATUS_RESERVED } from "../../../entity/Ticket";
import { Connection, EntityManager } from "typeorm";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { PurchaseValidatorService } from "./purchase-validator/purchase-validator.service";
import { PurchaseRepository } from "./PurchaseRepository";
import { CustomerRepository } from "../customer/CustomerRepository";
import { TicketRepository } from "../ticket/TicketRepository";

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
    ) {}

    async findPurchaseWithTicketAndTicketTypeAndEvent(id: number): Promise<Purchase | undefined> {
        const purchaseRepository = this.databaseConnection.getCustomRepository(PurchaseRepository);
        const purchase:
            | Purchase
            | undefined = await purchaseRepository.findPurchaseWithTicketAndTicketTypeAndEvent(id);

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

    // FIXME add authorization for this
    public async reserveTickets(customerId: number, ticketIds: number[]): Promise<Purchase> {
        const purchase: Purchase = await this.databaseConnection.transaction(
            "SERIALIZABLE",
            async (transactionalEntityManager: EntityManager) => {
                const customer:
                    | Customer
                    | undefined = await transactionalEntityManager
                    .getCustomRepository(CustomerRepository)
                    .findOne(customerId);

                if (customer == null) {
                    throw new BadRequestException("Customer does not exist");
                }

                if (ticketIds.length === 0) {
                    throw new BadRequestException("You must reserve at least 1 ticket");
                }

                const newPurchase = this.buildNewPurchase(customer);

                const ticketsToReserve = await transactionalEntityManager
                    .getCustomRepository(TicketRepository)
                    .findTicketsByIdsWithTicketTypeAndWithEvent(ticketIds);

                const eventIdsFromTickets: number[] = ticketsToReserve.map(ticket => {
                    return ticket.ticketType.event.id;
                });

                await this.purchaseValidatorService.validateTicketsForNewReservation(
                    ticketsToReserve,
                    ticketIds,
                    eventIdsFromTickets,
                    transactionalEntityManager,
                );

                this.addTicketsToPurchase(newPurchase, ticketsToReserve);

                await transactionalEntityManager.save(newPurchase);

                return newPurchase;
            },
        );

        return purchase;
    }

    private buildNewPurchase(customer: Customer): Purchase {
        const purchase = new Purchase();
        purchase.tickets = [];
        purchase.customer = customer;
        purchase.expiresAfter = Date.now() + EXPIRE_PURCHASE_AFTER_SECONDS; // FIXME DRY expiresAt
        purchase.status = PURCHASE_STATUS_WAITS_FOR_PAYMENT;
        purchase.totalPrice = 0;
        return purchase;
    }

    private addTicketsToPurchase(purchase: Purchase, ticketsToReserve: Ticket[]) {
        // Connect them with Purchase (Reservation)
        let totalPriceToPay = 0;
        ticketsToReserve.forEach(ticket => {
            totalPriceToPay += ticket.price;
            ticket.status = TICKET_STATUS_RESERVED;
        });

        purchase.tickets = ticketsToReserve;
        purchase.totalPrice = totalPriceToPay;
    }
}
