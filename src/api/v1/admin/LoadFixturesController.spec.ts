import { Test, TestingModule } from "@nestjs/testing";
import { LoadFixturesController } from "./LoadFixturesController";

// FIXME add tests
describe.skip("LoadFixtures Controller", () => {
    let controller: LoadFixturesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LoadFixturesController],
        }).compile();

        controller = module.get<LoadFixturesController>(LoadFixturesController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
