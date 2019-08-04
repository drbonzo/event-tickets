import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { EventEntity } from "./EventEntity";
import { Ticket } from "./Ticket";

export const SELLING_OPTION_EVEN = "even";
export const SELLING_OPTION_ALL_TOGETHER = "all_together";
export const SELLING_OPTION_AVOID_ONE = "avoid_one";

@Entity()
export class TicketType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    sellingOption: string;

    @ManyToOne(() => EventEntity, event => event.ticketTypes)
    event: EventEntity;

    @OneToMany(() => Ticket, ticket => ticket.ticketType, { cascade: true })
    tickets: Ticket[];
}
