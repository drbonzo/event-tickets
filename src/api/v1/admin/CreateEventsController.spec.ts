import { Test, TestingModule } from "@nestjs/testing";
import { CreateEventsController } from "./CreateEventsController";

describe("CreateEvents Controller", () => {
    let controller: CreateEventsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CreateEventsController],
        }).compile();

        controller = module.get<CreateEventsController>(CreateEventsController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
