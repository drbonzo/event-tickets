import { Test, TestingModule } from "@nestjs/testing";
import { PurchaseValidatorService } from "./PurchaseValidatorService";

describe("PurchaseValidatorService", () => {
    let service: PurchaseValidatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PurchaseValidatorService],
        }).compile();

        service = module.get<PurchaseValidatorService>(PurchaseValidatorService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
