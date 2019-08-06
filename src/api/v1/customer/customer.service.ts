import { Injectable } from "@nestjs/common";
import { Customer } from "../../../entity/Customer";
import { EntityManager } from "typeorm";
import { CustomerRepository } from "./CustomerRepository";

@Injectable()
export class CustomerService {
    async findCustomer(
        customerId: number,
        entityManager: EntityManager,
    ): Promise<Customer | undefined> {
        return await entityManager.getCustomRepository(CustomerRepository).findOne(customerId);
    }
}
