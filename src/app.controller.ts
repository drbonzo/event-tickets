import { Controller, Get, Inject } from "@nestjs/common";
import { AppService } from "./app.service";
import { DATABASE_CONNECTION } from "./providers/provider-names";
import { Connection } from "typeorm";
import { EventEntity } from "./entity/EventEntity";

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        @Inject(DATABASE_CONNECTION) private databaseConnection: Connection,
    ) {}

    @Get()
    async getHello(): Promise<string> {
        // tslint:disable-next-line:no-console
        console.log("Loading events from the database...");
        const events = await this.databaseConnection.manager.find(EventEntity);
        // tslint:disable-next-line:no-console
        console.log("Loaded events: ", events);

        return this.appService.getHello();
    }
}
