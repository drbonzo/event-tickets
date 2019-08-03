import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllEntities1564856021358 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "customer" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`,
        );
        await queryRunner.query(
            `CREATE TABLE "event_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "startDateTime" integer NOT NULL)`,
        );
        await queryRunner.query(
            `CREATE TABLE "purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "expiresAfter" integer, "status" varchar NOT NULL, "totalPrice" integer NOT NULL, "paymentToken" varchar)`,
        );
        await queryRunner.query(
            `CREATE TABLE "ticket" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" varchar NOT NULL, "status" varchar NOT NULL, "price" integer NOT NULL)`,
        );
        await queryRunner.query(
            `CREATE TABLE "ticket_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "sellingOption" varchar NOT NULL)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "ticket_type"`);
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`DROP TABLE "event_entity"`);
        await queryRunner.query(`DROP TABLE "customer"`);
    }
}
