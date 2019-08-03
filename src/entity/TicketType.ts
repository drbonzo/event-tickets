import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export const SELLING_OPTION_EVEN = "even";
export const SELLING_OPTION_ALL_TOGETHER = "all_together";
export const SELLING_OPTION_AVOID_ONE = "avoid_one";

@Entity()
export class TicketType {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    name: string;

    @Column()
    price: number;

    @Column()
    sellingOption: string;

}
