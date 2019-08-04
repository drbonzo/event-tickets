import { DateTimeStringISO8601 } from "../../../common-types";
// import { ArrayNotEmpty, IsArray, IsNotEmpty } from "class-validator";

// FIXME add validation with class-validator, and convert to class
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
