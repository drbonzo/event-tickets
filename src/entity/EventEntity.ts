import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TicketType } from "./TicketType";

// EventEntity - collided with global `Event` class - this is just fastest workaround, not the best
@Entity()
export class EventEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    startDateTime: number; // unix timestamp

    @OneToMany(() => TicketType, ticketType => ticketType.event, { cascade: true })
    ticketTypes: TicketType[];

    startsInFutureFrom(fromDateTime: number) {
        // FIXME should add 15 minutes buffer - so we make sure that we reserve active Event
        return this.startDateTime > fromDateTime;
    }
}
