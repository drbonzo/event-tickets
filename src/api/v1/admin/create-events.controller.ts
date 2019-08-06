import { BadRequestException, Body, Controller, Inject, Post } from "@nestjs/common";
import { CreateEventDTO, CreateTicketTypeDTO } from "./dto";
import { EventEntity } from "../../../entity/EventEntity";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection, EntityManager } from "typeorm";
import { TicketType } from "../../../entity/TicketType";
import { Ticket, TICKET_STATUS_AVAILABLE } from "../../../entity/Ticket";
import { TicketTypeRepository } from "../ticket-type/TicketTypeRepository";
import { TicketRepository } from "../ticket/TicketRepository";
import { EventEntityRepository } from "../events/EventEntityRepository";

@Controller("/api/v1/admin/events")
export class CreateEventsController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Post("/")
    public async createEvent(@Body() createEvent: CreateEventDTO): Promise<EventEntity> {
        const event = await this.databaseConnection.transaction(
            "SERIALIZABLE",
            async (transactionalEntityManager: EntityManager) => {
                const newEvent = new EventEntity();
                newEvent.name = createEvent.event.name; // FIXME validate
                newEvent.startDateTime = new Date(createEvent.event.startDateTime).valueOf(); // ISO -> number// FIXME validate

                const eventRepository = transactionalEntityManager.getCustomRepository(
                    EventEntityRepository,
                );
                await eventRepository.save(newEvent);

                await this.createTicketTypes(
                    newEvent,
                    createEvent.ticketTypes,
                    transactionalEntityManager,
                );

                return newEvent;
            },
        );

        // FIXME format date time: event.startDateTime
        return event;
    }

    private createTicketTypes(
        event: EventEntity,
        createTicketTypesDtos: CreateTicketTypeDTO[],
        entityManager: EntityManager,
    ): Promise<TicketType[]> {
        if (createTicketTypesDtos.length === 0) {
            throw new BadRequestException("Event must have at least single TicketType");
        }
        const ticketTypeRepository = entityManager.getCustomRepository(TicketTypeRepository);

        const promises: Array<Promise<TicketType>> = createTicketTypesDtos.map(
            async (createTicketType: CreateTicketTypeDTO) => {
                const newTicketType = new TicketType();
                newTicketType.event = event;
                newTicketType.name = createTicketType.name;
                newTicketType.sellingOption = createTicketType.sellingOption; // FIXME validate
                newTicketType.price = createTicketType.price; // FIXME validate

                await ticketTypeRepository.save(newTicketType);
                await this.createTickets(
                    newTicketType,
                    createTicketType.numberOfTickets,
                    entityManager,
                );

                return newTicketType;
            },
        );
        return Promise.all(promises);
    }

    private createTickets(
        ticketType: TicketType,
        numberOfTicketsToCreate: number,
        entityManager: EntityManager,
    ): Promise<Ticket[]> {
        if (numberOfTicketsToCreate === 0) {
            throw new BadRequestException(
                "You must create at least 1 Ticket for TicketType: " + ticketType.name,
            );
        }

        const ticketRepository = entityManager.getCustomRepository(TicketRepository);

        const newTicketPromises: Array<Promise<Ticket>> = [];
        for (let n = 0; n < numberOfTicketsToCreate; n++) {
            const newTicket = new Ticket();
            newTicket.ticketType = ticketType;
            newTicket.number = String(n + 1);
            newTicket.status = TICKET_STATUS_AVAILABLE;
            newTicket.price = ticketType.price;

            newTicketPromises.push(ticketRepository.save(newTicket));
        }

        return Promise.all(newTicketPromises);
    }
}
