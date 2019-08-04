import { ArrayNotEmpty, IsArray, IsNotEmpty } from "class-validator";

export class CreatePurchaseDTO {
    @IsNotEmpty()
    customerId: number;

    @IsArray()
    @ArrayNotEmpty()
    ticketIds: number[];
}
