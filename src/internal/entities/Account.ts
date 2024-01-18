import AbstractDatabase from "../database/AbstractDatabase";
import AbstractCache from "../cache/AbstractCache";
import {inject, injectable} from "inversify";
import TOKENS from "../../inversify.tokens";
import {TTransactionCredentials} from "../../types/index.type";


@injectable()
class Account {

    @inject(TOKENS.database)
    private readonly database: AbstractDatabase
    @inject(TOKENS.cache)
    private readonly cache: AbstractCache


    async setCredentials(invoice_id: string, credentials: TTransactionCredentials[]): Promise<void> {

        await Promise.all(credentials.map( async ({ address, network}): Promise<void> => {

            await this.database.account.setCredentials(invoice_id, address, network)
            await this.cache.setCredentials(address, network, invoice_id)

        }))

        return void 0

    }

    async getCredentials(invoice_id: string): Promise<TTransactionCredentials[]>
    {
        return await this.database.account.getCredentials(invoice_id)
    }


    async releaseAccount(invoice_id: string): Promise<void>
    {
       await this.database.account.releaseAccount(invoice_id)
    }

    async reserveAccount(invoice_id: string): Promise<number>
    {
        return await this.database.account.reserveAccount(invoice_id)
    }


    async deleteCredentials(invoice_id: string): Promise<void>
    {

        let credentials: TTransactionCredentials[] = await this.getCredentials(invoice_id)

        await Promise.all([
            await this.database.account.deleteCredentials(invoice_id),
            credentials.map( async (item) => {
                await this.cache.deleteCredentials(item.address, item.network)
            })
        ])

        return void 0

    }


    async checkCandidateAddresses(network: string, addresses: string[]): Promise<string[]>
    {

        const candidates: string[] | null = await this.cache.getAllCredentials(network)
        if(!candidates) return []

        return candidates
            .map((address) => {
                if(addresses.includes(address)) return address
                return null
            })
            .filter(i => i !== null)

    }





}


export default Account