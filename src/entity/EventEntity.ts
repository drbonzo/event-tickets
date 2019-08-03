import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TicketType } from "./TicketType";

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
