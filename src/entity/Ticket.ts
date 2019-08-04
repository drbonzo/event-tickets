import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TicketType } from "./TicketType";
import { Purchase } from "./Purchase";
import { Customer } from "./Customer";

export const TICKET_STATUS_AVAILABLE = "available";
export const TICKET_STATUS_RESERVED = "reserved";
export const TICKET_STATUS_SOLD = "sold";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    number: string;

    @Column()
    status: string;

    @Column()
    price: number;

    @ManyToOne(() => TicketType, ticketType => ticketType.tickets)
    ticketType: TicketType;

    @ManyToOne(() => Purchase, purchase => purchase.tickets, { nullable: true })
    purchase: Purchase;

    @ManyToOne(() => Customer, customer => customer.tickets, { nullable: true })
    customer: Customer;
}
