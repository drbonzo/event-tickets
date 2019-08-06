import { AbstractRepository, EntityRepository } from "typeorm";
import { Customer } from "../../../entity/Customer";

@EntityRepository(Customer)
export class CustomerRepository extends AbstractRepository<Customer> {
    async findOne(customerId: number): Promise<Customer | undefined> {
        return await this.repository.findOne(customerId);
    }
}
