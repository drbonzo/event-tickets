import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export const PURCHASE_STATUS_WAITS_FOR_PAYMENT = "waits_for_payment";
export const PURCHASE_STATUS_EXPIRED = "expired";
export const PURCHASE_STATUS_PAID = "paid";

@Entity()
export class Purchase {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column({ nullable: true })
    expiresAfter: number; // date as unit timestamp

    @Column()
    status: string;

    @Column()
    totalPrice: number;

    @Column({ nullable: true })
    paymentToken: string;
}
