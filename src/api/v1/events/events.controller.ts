import { Controller, Get, Param } from "@nestjs/common";
import {
    EventsService,
    EventWithTicketCounts,
    EventWithTicketTypesAndTickets,
} from "./events.service";

@Controller("/api/v1/events")
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get("")
    public async getAllEvents(): Promise<EventWithTicketCounts[]> {
        return await this.eventsService.getAllEvents();
    }

    @Get("/:id")
    public async getEventDetails(@Param("id") id: number): Promise<EventWithTicketTypesAndTickets> {
        return await this.eventsService.getEventDetails(id);
    }
}
