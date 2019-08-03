import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class EventEntity {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    name: string;

    @Column()
    startDateTime: number; // unix timestamp

}
