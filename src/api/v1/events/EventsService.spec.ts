import { Test, TestingModule } from "@nestjs/testing";
import { EventsService } from "./EventsService";

// FIXME add tests
describe.skip("EventsService", () => {
    let service: EventsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EventsService],
        }).compile();

        service = module.get<EventsService>(EventsService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
