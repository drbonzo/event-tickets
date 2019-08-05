import { ArrayNotEmpty, IsArray, IsNotEmpty } from "class-validator";

export class CreatePurchaseDTO {
    @IsNotEmpty()
    customerId: number;

    @IsNotEmpty()
    ticketIds: number[] | number;
}
