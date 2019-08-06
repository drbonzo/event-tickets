import { Body, Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { Purchase } from "../../../entity/Purchase";
import { CreatePurchaseDTO } from "./dto";
import { PurchaseDetails, PurchaseService } from "./purchase.service";

@Controller("/api/v1/purchases")
export class PurchasesController {
    constructor(private readonly purchaseService: PurchaseService) {}

    @Post("/")
    public async reserveTickets(
        @Body() createPurchaseDto: CreatePurchaseDTO,
    ): Promise<PurchaseDetails> {
        const ticketIds: number[] = Array.isArray(createPurchaseDto.ticketIds)
            ? createPurchaseDto.ticketIds
            : [createPurchaseDto.ticketIds];

        const purchase: Purchase = await this.purchaseService.reserveTickets(
            createPurchaseDto.customerId,
            ticketIds,
        );

        return this.purchaseService.buildPurchaseDetails(purchase);
    }

    @Get("/:id")
    public async getPurchaseStatus(@Param("id") id: number): Promise<PurchaseDetails> {
        const purchase = await this.purchaseService.findPurchaseWithTicketAndTicketTypeAndEvent(id);

        if (purchase === undefined) {
            throw new NotFoundException(`Purchase not found`);
        }

        return this.purchaseService.buildPurchaseDetails(purchase);
    }
}
