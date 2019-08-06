import { Injectable } from "@nestjs/common";
import { Customer } from "../../../entity/Customer";
import { EntityManager } from "typeorm";

@Injectable()
export class CustomerService {
    async findCustomer(
        customerId: number,
        entityManager: EntityManager,
    ): Promise<Customer | undefined> {
        return await entityManager.getRepository(Customer).findOne(customerId);
    }
}
