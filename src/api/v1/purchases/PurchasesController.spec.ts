import { Test, TestingModule } from "@nestjs/testing";
import { PurchasesController } from "./PurchasesController";

// FIXME add tests
describe.skip("Purchases Controller", () => {
    let controller: PurchasesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PurchasesController],
        }).compile();

        controller = module.get<PurchasesController>(PurchasesController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
