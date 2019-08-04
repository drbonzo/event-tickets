import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Ticket } from "./Ticket";
import { Customer } from "./Customer";

export const PURCHASE_STATUS_WAITS_FOR_PAYMENT = "waits_for_payment";
export const PURCHASE_STATUS_EXPIRED = "expired";
export const PURCHASE_STATUS_PAID = "paid";

@Entity()
export class Purchase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    expiresAfter?: number; // date as unit timestamp

    @Column()
    status: string;

    @Column()
    totalPrice: number;

    @Column({ nullable: true })
    paymentToken: string;

    @OneToMany(() => Ticket, ticket => ticket.purchase)
    tickets: Ticket[];

    @ManyToOne(() => Customer, customer => customer.purchases, { nullable: true })
    customer: Customer;
}
