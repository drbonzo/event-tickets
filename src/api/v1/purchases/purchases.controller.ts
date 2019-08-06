import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Inject,
    NotFoundException,
    Param,
    Post,
} from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection, EntityManager } from "typeorm";
import { Purchase } from "../../../entity/Purchase";
import { CreatePurchaseDTO } from "./dto";
import { Customer } from "../../../entity/Customer";
import { CustomerService } from "../customer/customer.service";
import { PurchaseDetails, PurchaseService } from "./purchase.service";

@Controller("/api/v1/purchases")
export class PurchasesController {
    constructor(
        @Inject(DATABASE_CONNECTION) private readonly databaseConnection: Connection,
        private readonly customerService: CustomerService,
        private readonly purchaseService: PurchaseService,
    ) {}

    @Post("/")
    public async reserveTickets(
        @Body() createPurchaseDto: CreatePurchaseDTO,
    ): Promise<PurchaseDetails> {
        const purchase: Purchase = await this.databaseConnection.transaction(
            "SERIALIZABLE",
            async (transactionalEntityManager: EntityManager) => {
                // FIXME add authorization for this
                const customer: Customer | undefined = await this.customerService.findCustomer(
                    createPurchaseDto.customerId,
                    transactionalEntityManager,
                );

                const ticketIds: number[] = Array.isArray(createPurchaseDto.ticketIds)
                    ? createPurchaseDto.ticketIds
                    : [createPurchaseDto.ticketIds];

                if (customer == null) {
                    throw new BadRequestException("Customer does not exist");
                }

                if (ticketIds.length === 0) {
                    throw new BadRequestException("You must reserve at least 1 ticket");
                }

                return await this.purchaseService.reserveTickets(
                    customer,
                    ticketIds,
                    transactionalEntityManager,
                );
            },
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
