import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DATABASE_CONNECTION } from "./providers/provider-names";
import { createConnection } from "typeorm";
import { CreateEventsController } from "./api/v1/admin/CreateEventsController";
import { EventsController } from "./api/v1/events/EventsController";
import { LoadFixturesController } from "./api/v1/admin/LoadFixturesController";
import { PurchasesController } from "./api/v1/purchases/PurchasesController";
import { EventsService } from "./api/v1/events/EventsService";
import { PurchaseService } from "./api/v1/purchases/PurchaseService";
import { PurchaseValidatorService } from "./api/v1/purchases/PurchaseValidatorService";

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
        PurchaseService,
        PurchaseValidatorService,
    ],
})
export class AppModule {}
