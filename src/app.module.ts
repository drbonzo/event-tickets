import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DATABASE_CONNECTION } from "./providers/provider-names";
import { createConnection } from "typeorm";
import { CreateEventsController } from "./api/v1/admin/create-events.controller";
import { EventsController } from "./api/v1/events/events.controller";
import { LoadFixturesController } from "./api/v1/admin/load-fixtures.controller";
import { PurchasesController } from "./api/v1/purchases/purchases.controller";
import { EventsService } from "./api/v1/events/events.service";
import { TicketService } from "./api/v1/ticket/ticket.service";
import { CustomerService } from "./api/v1/customer/customer.service";
import { PurchaseService } from "./api/v1/purchase/purchase.service";

@Module({
    imports: [],
    controllers: [
        AppController,
        CreateEventsController,
        EventsController,
        LoadFixturesController,
        PurchasesController,
    ],
    providers: [
        AppService,
        {
            // TypeORM:
            provide: DATABASE_CONNECTION,
            useFactory: async () => {
                const connection = await createConnection();
                return connection;
            },
        },
        EventsService,
        TicketService,
        CustomerService,
        PurchaseService,
    ],
})
export class AppModule {}
