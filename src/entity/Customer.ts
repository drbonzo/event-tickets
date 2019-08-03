import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Customer {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    name: string;
}
