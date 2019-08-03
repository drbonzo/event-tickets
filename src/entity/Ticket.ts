import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export const TICKET_STATUS_AVAILABLE = "available";
export const TICKET_STATUS_RESERVED = "reserved";
export const TICKET_STATUS_SOLD = "sold";

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    number: string;

    @Column()
    status: string;

    @Column()
    price: number;
}
