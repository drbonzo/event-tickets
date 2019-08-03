import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationsToAllEntities1564858152112 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "temporary_ticket_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "sellingOption" varchar NOT NULL, "eventId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_ticket_type"("id", "name", "price", "sellingOption") SELECT "id", "name", "price", "sellingOption" FROM "ticket_type"`,
        );
        await queryRunner.query(`DROP TABLE "ticket_type"`);
        await queryRunner.query(`ALTER TABLE "temporary_ticket_type" RENAME TO "ticket_type"`);
        await queryRunner.query(
            `CREATE TABLE "temporary_purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "expiresAfter" integer, "status" varchar NOT NULL, "totalPrice" integer NOT NULL, "paymentToken" varchar, "customerId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_purchase"("id", "expiresAfter", "status", "totalPrice", "paymentToken") SELECT "id", "expiresAfter", "status", "totalPrice", "paymentToken" FROM "purchase"`,
        );
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase" RENAME TO "purchase"`);
        await queryRunner.query(
            `CREATE TABLE "temporary_ticket" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" varchar NOT NULL, "status" varchar NOT NULL, "price" integer NOT NULL, "ticketTypeId" integer, "purchaseId" integer, "customerId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_ticket"("id", "number", "status", "price") SELECT "id", "number", "status", "price" FROM "ticket"`,
        );
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`ALTER TABLE "temporary_ticket" RENAME TO "ticket"`);
        await queryRunner.query(
            `CREATE TABLE "temporary_ticket_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "sellingOption" varchar NOT NULL, "eventId" integer, CONSTRAINT "FK_f9565dc40fcd98961539814b50b" FOREIGN KEY ("eventId") REFERENCES "event_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_ticket_type"("id", "name", "price", "sellingOption", "eventId") SELECT "id", "name", "price", "sellingOption", "eventId" FROM "ticket_type"`,
        );
        await queryRunner.query(`DROP TABLE "ticket_type"`);
        await queryRunner.query(`ALTER TABLE "temporary_ticket_type" RENAME TO "ticket_type"`);
        await queryRunner.query(
            `CREATE TABLE "temporary_purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "expiresAfter" integer, "status" varchar NOT NULL, "totalPrice" integer NOT NULL, "paymentToken" varchar, "customerId" integer, CONSTRAINT "FK_2195a69f2b102198a497036ec9e" FOREIGN KEY ("customerId") REFERENCES "customer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_purchase"("id", "expiresAfter", "status", "totalPrice", "paymentToken", "customerId") SELECT "id", "expiresAfter", "status", "totalPrice", "paymentToken", "customerId" FROM "purchase"`,
        );
        await queryRunner.query(`DROP TABLE "purchase"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase" RENAME TO "purchase"`);
        await queryRunner.query(
            `CREATE TABLE "temporary_ticket" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" varchar NOT NULL, "status" varchar NOT NULL, "price" integer NOT NULL, "ticketTypeId" integer, "purchaseId" integer, "customerId" integer, CONSTRAINT "FK_7061359da242fbf565771953137" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_type" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_a3ca25966f63d4c14b55c168412" FOREIGN KEY ("purchaseId") REFERENCES "purchase" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_8932781487db15d1393b206482e" FOREIGN KEY ("customerId") REFERENCES "customer" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_ticket"("id", "number", "status", "price", "ticketTypeId", "purchaseId", "customerId") SELECT "id", "number", "status", "price", "ticketTypeId", "purchaseId", "customerId" FROM "ticket"`,
        );
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`ALTER TABLE "temporary_ticket" RENAME TO "ticket"`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "ticket" RENAME TO "temporary_ticket"`);
        await queryRunner.query(
            `CREATE TABLE "ticket" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" varchar NOT NULL, "status" varchar NOT NULL, "price" integer NOT NULL, "ticketTypeId" integer, "purchaseId" integer, "customerId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "ticket"("id", "number", "status", "price", "ticketTypeId", "purchaseId", "customerId") SELECT "id", "number", "status", "price", "ticketTypeId", "purchaseId", "customerId" FROM "temporary_ticket"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_ticket"`);
        await queryRunner.query(`ALTER TABLE "purchase" RENAME TO "temporary_purchase"`);
        await queryRunner.query(
            `CREATE TABLE "purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "expiresAfter" integer, "status" varchar NOT NULL, "totalPrice" integer NOT NULL, "paymentToken" varchar, "customerId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "purchase"("id", "expiresAfter", "status", "totalPrice", "paymentToken", "customerId") SELECT "id", "expiresAfter", "status", "totalPrice", "paymentToken", "customerId" FROM "temporary_purchase"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_purchase"`);
        await queryRunner.query(`ALTER TABLE "ticket_type" RENAME TO "temporary_ticket_type"`);
        await queryRunner.query(
            `CREATE TABLE "ticket_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "sellingOption" varchar NOT NULL, "eventId" integer)`,
        );
        await queryRunner.query(
            `INSERT INTO "ticket_type"("id", "name", "price", "sellingOption", "eventId") SELECT "id", "name", "price", "sellingOption", "eventId" FROM "temporary_ticket_type"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_ticket_type"`);
        await queryRunner.query(`ALTER TABLE "ticket" RENAME TO "temporary_ticket"`);
        await queryRunner.query(
            `CREATE TABLE "ticket" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "number" varchar NOT NULL, "status" varchar NOT NULL, "price" integer NOT NULL)`,
        );
        await queryRunner.query(
            `INSERT INTO "ticket"("id", "number", "status", "price") SELECT "id", "number", "status", "price" FROM "temporary_ticket"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_ticket"`);
        await queryRunner.query(`ALTER TABLE "purchase" RENAME TO "temporary_purchase"`);
        await queryRunner.query(
            `CREATE TABLE "purchase" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "expiresAfter" integer, "status" varchar NOT NULL, "totalPrice" integer NOT NULL, "paymentToken" varchar)`,
        );
        await queryRunner.query(
            `INSERT INTO "purchase"("id", "expiresAfter", "status", "totalPrice", "paymentToken") SELECT "id", "expiresAfter", "status", "totalPrice", "paymentToken" FROM "temporary_purchase"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_purchase"`);
        await queryRunner.query(`ALTER TABLE "ticket_type" RENAME TO "temporary_ticket_type"`);
        await queryRunner.query(
            `CREATE TABLE "ticket_type" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "sellingOption" varchar NOT NULL)`,
        );
        await queryRunner.query(
            `INSERT INTO "ticket_type"("id", "name", "price", "sellingOption") SELECT "id", "name", "price", "sellingOption" FROM "temporary_ticket_type"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_ticket_type"`);
    }
}
