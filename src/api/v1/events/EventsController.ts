import { Controller, Get, Inject, Param } from "@nestjs/common";
import {
    EVENTS_SERVICE,
    EventsService,
    EventsServiceInterface,
    EventWithTicketTypesAndTickets,
} from "./EventsService";
import { EventWithTicketCounts } from "./EventEntityRepository";

@Controller("/api/v1/events")
export class EventsController {
    constructor(@Inject(EVENTS_SERVICE) private readonly eventsService: EventsServiceInterface) {}

    @Get("")
    public async getAllEvents(): Promise<EventWithTicketCounts[]> {
        return await this.eventsService.getAllEvents();
    }

    @Get("/:id")
    public async getEventDetails(@Param("id") id: number): Promise<EventWithTicketTypesAndTickets> {
        return await this.eventsService.getEventDetails(id);
    }
}
