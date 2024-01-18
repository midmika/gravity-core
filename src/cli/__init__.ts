import AbstractDatabase from "../internal/database/AbstractDatabase";
import Postgres from "../internal/database/postgres/Postgres";
import AbstractCache from "../internal/cache/AbstractCache";
import Redis from "../internal/cache/redis/Redis";
import AbstractMessenger from "../internal/messenger/AbstractMessenger";
import RedisMessenger from "../internal/messenger/redis/RedisMessenger";
import {container} from "../inversify.config";
import TOKENS from "../inversify.tokens";
import {AbstractLogger} from "../internal/logger/AbstractLogger";
import BlankLogger from "../internal/logger/blank/BlankLogger";

const __init__ = async () => {
    const database: AbstractDatabase = await Postgres.connect()
    const cache: AbstractCache = await Redis.connect()
    const messenger: AbstractMessenger = await RedisMessenger.connect()

    container.bind<AbstractDatabase>(TOKENS.database).toConstantValue(database)
    container.bind<AbstractCache>(TOKENS.cache).toConstantValue(cache)
    container.bind<AbstractLogger>(TOKENS.logger).toConstantValue(new BlankLogger())
    container.bind<AbstractMessenger>(TOKENS.messenger).toConstantValue(messenger)
    container.bind<string>(TOKENS.mnemonic).toConstantValue(process.env.MNEMONIC)

    return async () => {
        await Promise.all([
            await database.disconnect(),
            await cache.disconnect(),
            await messenger.disconnect()
        ])
    }

}

export default __init__