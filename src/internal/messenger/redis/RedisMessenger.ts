import AbstractMessenger, {EMessengerType} from "../AbstractMessenger";
import {RedisClientType} from "redis";
import {getRedisClient} from "../../cache/redis/Redis";


class RedisMessenger implements AbstractMessenger {

    private readonly client: RedisClientType

    constructor(client: RedisClientType)
    {
        this.client = client
    }

    static async connect(): Promise<AbstractMessenger> {
        const client: RedisClientType = await getRedisClient()
        return new RedisMessenger(client)
    }

    async disconnect(): Promise<void>
    {
        await this.client.disconnect()
    }

    async on<T>(type: EMessengerType, callback: (data: T) => any | Promise<any>): Promise<void>
    {
        await this.client.subscribe(type, (data: string) => callback(JSON.parse(data)))
    }

    async emit<T>(type: EMessengerType, data: T): Promise<void>
    {
        await this.client.publish(type, JSON.stringify(data))
    }

}

export default RedisMessenger