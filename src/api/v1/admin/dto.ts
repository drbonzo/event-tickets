import { DateTimeStringISO8601 } from "../../../common-types";

export interface CreateTicketTypeDTO {
    name: string;
    sellingOption: string;
    numberOfTickets: number; // FIXME > 0
    price: number; // FIXME > 0
}

export interface CreateEventDTO {
    event: {
        name: string;
        startDateTime: DateTimeStringISO8601;
    };
    ticketTypes: CreateTicketTypeDTO[];
}
