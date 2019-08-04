import { BadRequestException, Controller, Inject, Post } from "@nestjs/common";
import { CreateEventDTO, CreateTicketTypeDTO } from "./dto";
import { EventEntity } from "../../../entity/EventEntity";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection, EntityManager } from "typeorm";
import {
    SELLING_OPTION_ALL_TOGETHER,
    SELLING_OPTION_AVOID_ONE,
    SELLING_OPTION_EVEN,
    TicketType,
} from "../../../entity/TicketType";
import {
    Ticket,
    TICKET_STATUS_AVAILABLE,
    TICKET_STATUS_RESERVED,
    TICKET_STATUS_SOLD,
} from "../../../entity/Ticket";
import { Customer } from "../../../entity/Customer";
import {
    Purchase,
    PURCHASE_STATUS_PAID,
    PURCHASE_STATUS_WAITS_FOR_PAYMENT,
} from "../../../entity/Purchase";

// Simplifiex Date modifiation
const addNDaysFromNow = (daysCount: number): string => {
    const seconds = 3600 * 24 * daysCount;
    return new Date(Date.now() + seconds).toISOString();
};

// FIXME DRY with CreateEventsController???
@Controller("/api/v1/admin/fixtures")
export class LoadFixturesController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Post("")
    public async fillDatabaseWithFixtures(): Promise<string> {
        await this.databaseConnection.transaction(
            "SERIALIZABLE",
            async (transactionalEntityManager: EntityManager) => {
                await this.clearDatabase(transactionalEntityManager);

                const customerA = await this.createCustomer(
                    "Customer A",
                    transactionalEntityManager,
                );
                await this.createCustomer("Customer B", transactionalEntityManager);
                await this.createCustomer("Customer C", transactionalEntityManager);
                await this.createPastEvent(transactionalEntityManager);
                await this.createSoldEvent(customerA, transactionalEntityManager);
                await this.createReservedEvent(transactionalEntityManager);
                await this.createMixedEvent(transactionalEntityManager);
                await this.createMultipleTicketTypeEvent(transactionalEntityManager);
            },
        );

        return "OK";
    }

    private async createCustomer(
        customerName: string,
        entityManager: EntityManager,
    ): Promise<Customer> {
        const customer = new Customer();
        customer.name = customerName;
        await entityManager.save(customer);

        return customer;
    }

    private async createEvent(
        createEvent: CreateEventDTO,
        entityManager: EntityManager,
    ): Promise<EventEntity> {
        const newEvent = new EventEntity();
        newEvent.name = createEvent.event.name; // FIXME validate
        newEvent.startDateTime = new Date(createEvent.event.startDateTime).valueOf(); // ISO -> number// FIXME validate

        const ticketTypes = this.createTicketTypes(newEvent, createEvent.ticketTypes);
        newEvent.ticketTypes = ticketTypes;

        await entityManager.save(newEvent);

        return newEvent;
    }

    private createTicketTypes(
        event: EventEntity,
        createTicketTypesDtos: CreateTicketTypeDTO[],
    ): TicketType[] {
        if (createTicketTypesDtos.length === 0) {
            throw new BadRequestException("Event must have at least single TicketType");
        }

        const newTicketTypes: TicketType[] = createTicketTypesDtos.map(
            (createTicketType: CreateTicketTypeDTO) => {
                const newTicketType = new TicketType();
                newTicketType.event = event;
                newTicketType.name = createTicketType.name;
                newTicketType.sellingOption = createTicketType.sellingOption; // FIXME validate
                newTicketType.price = createTicketType.price; // FIXME validate

                const tickets = this.createTickets(newTicketType, createTicketType.numberOfTickets);

                newTicketType.tickets = tickets;

                return newTicketType;
            },
        );
        return newTicketTypes;
    }

    private createTickets(ticketType: TicketType, numberOfTicketsToCreate: number): Ticket[] {
        if (numberOfTicketsToCreate === 0) {
            throw new BadRequestException(
                "You must create at least 1 Ticket for TicketType: " + ticketType.name,
            );
        }

        const newTickets: Ticket[] = [];
        for (let n = 0; n < numberOfTicketsToCreate; n++) {
            const newTicket = new Ticket();
            newTicket.ticketType = ticketType;
            newTicket.number = String(n + 1);
            newTicket.status = TICKET_STATUS_AVAILABLE;
            newTicket.price = ticketType.price;

            newTickets.push(newTicket);
        }

        return newTickets;
    }

    private async clearDatabase(transactionalEntityManager: EntityManager): Promise<void> {
        await transactionalEntityManager.query("DELETE FROM ticket");
        await transactionalEntityManager.query("DELETE FROM ticket_type");
        await transactionalEntityManager.query("DELETE FROM event_entity");
        await transactionalEntityManager.query("DELETE FROM purchase");
        await transactionalEntityManager.query("DELETE FROM customer");
        await transactionalEntityManager.query(
            "DELETE FROM sqlite_sequence WHERE name != 'migrations'",
        );
    }

    private async createPastEvent(entityManager: EntityManager): Promise<EventEntity> {
        // Past Event
        return await this.createEvent(
            {
                event: {
                    name: "Past Event #1",
                    startDateTime: addNDaysFromNow(-365),
                },
                ticketTypes: [
                    {
                        name: "Type #1.1",
                        price: 100,
                        numberOfTickets: 10,
                        sellingOption: SELLING_OPTION_EVEN,
                    },
                ],
            },
            entityManager,
        );
    }

    private async createSoldEvent(
        customer: Customer,
        entityManager: EntityManager,
    ): Promise<EventEntity> {
        const soldEvent = await this.createEvent(
            {
                event: {
                    name: "Event #2 - Sold",
                    startDateTime: addNDaysFromNow(2),
                },
                ticketTypes: [
                    {
                        name: "Type #2.1",
                        price: 100,
                        numberOfTickets: 10,
                        sellingOption: SELLING_OPTION_EVEN,
                    },
                ],
            },
            entityManager,
        );

        let totalPriceToPay = 0;
        for (const ticketType of soldEvent.ticketTypes) {
            for (const ticket of ticketType.tickets) {
                totalPriceToPay += ticket.price;
            }
        }

        // FIXME use Service to buy tickets
        const purchase = new Purchase();
        // purchase.expiresAfter = null;
        purchase.status = PURCHASE_STATUS_PAID;
        purchase.customer = customer;
        purchase.paymentToken = "FOO";
        purchase.totalPrice = totalPriceToPay;
        await entityManager.save(purchase);

        for (const ticketType of soldEvent.ticketTypes) {
            for (const ticket of ticketType.tickets) {
                ticket.status = TICKET_STATUS_SOLD;
                ticket.purchase = purchase;
                ticket.customer = customer;
                await entityManager.save(ticket);
            }
        }

        return soldEvent;
    }

    private async createReservedEvent(entityManager: EntityManager): Promise<EventEntity> {
        const soldEvent = await this.createEvent(
            {
                event: {
                    name: "Event #3 - Reserved",
                    startDateTime: addNDaysFromNow(3),
                },
                ticketTypes: [
                    {
                        name: "Type #3.1",
                        price: 100,
                        numberOfTickets: 10,
                        sellingOption: SELLING_OPTION_EVEN,
                    },
                ],
            },
            entityManager,
        );

        // mark tickets as reserved, without connecting to Purchase
        for (const ticketType of soldEvent.ticketTypes) {
            for (const ticket of ticketType.tickets) {
                ticket.status = TICKET_STATUS_RESERVED;
                await entityManager.save(ticket);
            }
        }

        return soldEvent;
    }

    private async createMixedEvent(entityManager: EntityManager): Promise<EventEntity> {
        const soldEvent = await this.createEvent(
            {
                event: {
                    name: "Event #4 - Mixed",
                    startDateTime: addNDaysFromNow(4),
                },
                ticketTypes: [
                    {
                        name: "Type #4.1",
                        price: 100,
                        numberOfTickets: 12,
                        sellingOption: SELLING_OPTION_EVEN,
                    },
                ],
            },
            entityManager,
        );

        // mark tickets as reserved, without connecting to Purchase
        for (const ticketType of soldEvent.ticketTypes) {
            for (const ticket of ticketType.tickets) {
                // Dirty hack, split statuses 1/3
                if (Number(ticket.number) % 3 === 0) {
                    ticket.status = TICKET_STATUS_AVAILABLE;
                }
                if (Number(ticket.number) % 3 === 1) {
                    ticket.status = TICKET_STATUS_RESERVED;
                }
                if (Number(ticket.number) % 3 === 2) {
                    ticket.status = TICKET_STATUS_SOLD;
                }
                await entityManager.save(ticket);
            }
        }

        return soldEvent;
    }

    private async createMultipleTicketTypeEvent(
        entityManager: EntityManager,
    ): Promise<EventEntity> {
        const soldEvent = await this.createEvent(
            {
                event: {
                    name: "Event #5 - Multiple TT",
                    startDateTime: addNDaysFromNow(5),
                },
                ticketTypes: [
                    {
                        name: "Type #5.1",
                        price: 100,
                        numberOfTickets: 5,
                        sellingOption: SELLING_OPTION_EVEN,
                    },
                    {
                        name: "Type #5.2",
                        price: 50,
                        numberOfTickets: 10,
                        sellingOption: SELLING_OPTION_ALL_TOGETHER,
                    },
                    {
                        name: "Type #5.3",
                        price: 25,
                        numberOfTickets: 20,
                        sellingOption: SELLING_OPTION_AVOID_ONE,
                    },
                ],
            },
            entityManager,
        );

        return soldEvent;
    }
}
