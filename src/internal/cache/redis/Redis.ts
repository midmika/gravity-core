import {createClient, RedisClientType} from "redis"

import type AbstractCache from "../AbstractCache"
import {TCacheQueueInfo} from "../../../types/index.type";



const getClient = async (): Promise<RedisClientType> => {
    const client: RedisClientType = createClient({ url: process.env.REDIS_URL })
    await client.connect()
    return client
}

class Redis implements AbstractCache {

    private readonly client: RedisClientType

    constructor(client: RedisClientType) {
        this.client = client
    }

    static async connect(): Promise<AbstractCache> {
        const client: RedisClientType = await getClient()
        return new Redis(client)
    }

    async disconnect(): Promise<void> {
        await this.client.disconnect()
    }


    async flush(): Promise<void> {
        await this.client.flushAll()
    }


    /* Credentials */
    async setCredentials(address: string, network: string, invoice_id: string): Promise<void> {
        await this.client.hSet('account:' + network, address, invoice_id)
        return void 0
    }

    async deleteCredentials(address: string, network: string): Promise<void> {
        await this.client.hDel('account:' + network, address)
        return void 0
    }

    async getAllCredentials(network: string): Promise<string[] | null> {
        return await this.client.hKeys('account:' + network)
    }

    async getInvoiceId(address: string, network: string): Promise<string | null> {
        return await this.client.hGet('account:' + network, address)
    }



    async addConfirmationQueue(
        network: string,
        target_block_number: number,
        tx_id: string,
        tx_hash: string
    ): Promise<void> {
        await this.client.hSet('queue:' + network + ":" + target_block_number, tx_id, tx_hash)
        return void 0
    }


    async getConfirmationQueue(
        network: string,
        target_block_number: number,
    ): Promise<TCacheQueueInfo[]>
    {
        const data: { [tx_hash: string]: string } = await this.client.hGetAll(
            'queue:' + network + ":" + target_block_number
        )

        if(!data) return []

        return Object.entries(data).map((_) => {
            const [tx_id, tx_hash] = _
            return { tx_id, tx_hash }
        })

    }

    async deleteConfirmationQueue(network: string, tx_hash: string): Promise<void>
    {
        await this.client.hDel('queue:' + network, tx_hash)
    }

}

export { getClient as getRedisClient }
export default Redis