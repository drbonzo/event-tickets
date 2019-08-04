import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Ticket } from "./Ticket";
import { Purchase } from "./Purchase";

@Entity()
export class Customer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Ticket, ticket => ticket.customer)
    tickets: Ticket[];

    @OneToMany(() => Purchase, purchase => purchase.tickets)
    purchases: Purchase[];
}
