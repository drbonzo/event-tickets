import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TicketType } from "./TicketType";

// EventEntity - collided with global `Event` class - this is just fastest workaround, not the best
@Entity()
export class EventEntity {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    name: string;

    @Column()
    startDateTime: number; // unix timestamp

    @OneToMany(() => TicketType, ticketType => ticketType.event)
    ticketTypes: TicketType[];
}
