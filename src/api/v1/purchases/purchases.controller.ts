import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";
import { DATABASE_CONNECTION } from "../../../providers/provider-names";
import { Connection } from "typeorm";
import { Purchase } from "../../../entity/Purchase";
import { Ticket } from "../../../entity/Ticket";

interface PurchaseDetails {
    purchase: {
        id: number;
        status: string;
        totalPrice: number;
    };
    ticketData: Array<{
        id: number;
        number: string;
        price: number;
        typeName: string;
        eventName: string;
    }>;
}

@Controller("/api/v1/purchases")
export class PurchasesController {
    constructor(@Inject(DATABASE_CONNECTION) private databaseConnection: Connection) {}

    @Get("/:id")
    public async getPurchaseStatus(@Param("id") id: number): Promise<PurchaseDetails> {
        const purchaseRepository = this.databaseConnection.getRepository(Purchase);
        // FIXME this could be optimized:
        // TODO for Sorting - use QueryBuilder
        const purchase: Purchase | undefined = await purchaseRepository.findOne(id, {
            relations: ["tickets", "tickets.ticketType", "tickets.ticketType.event"],
        });

        if (purchase === undefined) {
            throw new NotFoundException(`Purchase not found`);
        }

        const retval: PurchaseDetails = {
            purchase: {
                id: purchase.id,
                status: purchase.status,
                totalPrice: purchase.totalPrice,
            },
            ticketData: purchase.tickets.map((ticket: Ticket) => {
                return {
                    id: ticket.id,
                    number: ticket.number,
                    price: ticket.price,
                    typeName: ticket.ticketType.name,
                    eventName: ticket.ticketType.event.name,
                };
            }),
        };

        return retval;
    }
}
