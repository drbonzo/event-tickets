import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DATABASE_CONNECTION } from "./providers/provider-names";
import { createConnection } from "typeorm";
import { CreateEventsController } from "./api/v1/admin/create-events.controller";
import { EventsController } from "./api/v1/events/events.controller";

@Module({
    imports: [],
    controllers: [AppController, CreateEventsController, EventsController],
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
    ],
})
export class AppModule {}
