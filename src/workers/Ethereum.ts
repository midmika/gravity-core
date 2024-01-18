import AbstractDatabase from "../internal/database/AbstractDatabase";
import Postgres from "../internal/database/postgres/Postgres";
import AbstractCache from "../internal/cache/AbstractCache";
import Redis from "../internal/cache/redis/Redis";
import AbstractMessenger from "../internal/messenger/AbstractMessenger";
import RedisMessenger from "../internal/messenger/redis/RedisMessenger";
import {container} from "../inversify.config";
import TOKENS from "../inversify.tokens";
import {AbstractLogger} from "../internal/logger/AbstractLogger";
import ConsoleLogger from "../internal/logger/console/ConsoleLogger";
import {TFoundTransaction} from "../types/index.type";
import EthereumObserver from "./EthereumObserver";
import ObserveHelper from "../internal/entities/ObserveHelper";


const bindings = async (): Promise<void> => {

    const database: AbstractDatabase = await Postgres.connect()
    const cache: AbstractCache = await Redis.connect()
    const messenger: AbstractMessenger = await RedisMessenger.connect()

    container.bind<AbstractDatabase>(TOKENS.database).toConstantValue(database)
    container.bind<AbstractCache>(TOKENS.cache).toConstantValue(cache)
    container.bind<AbstractLogger>(TOKENS.logger).toConstantValue(new ConsoleLogger())
    container.bind<AbstractMessenger>(TOKENS.messenger).toConstantValue(messenger)

    container.bind<string>(TOKENS.mnemonic).toConstantValue(process.env.MNEMONIC)
    container.bind<string>(TOKENS.network_name).toConstantValue(process.env.name)
    container.bind<number>(TOKENS.confirmation_count).toConstantValue(Number(process.env.confirmation_count))
}


const start = async (): Promise<void> => {

    await bindings()

    const Observer: EthereumObserver = new EthereumObserver(process.env.endpoint, process.env.contract_address)

    const processor: ObserveHelper = container.get(ObserveHelper)
    const logger: AbstractLogger = container.get(TOKENS.logger)

    const onNewBlock = async (block_number: number, txs: TFoundTransaction[]): Promise<void> =>
    {

        /* Check and create new transactions */
        await processor.aggregateCandidates(txs)

        /* Check and confirm pending transactions */
        await processor.checkConfirmationQueue(block_number, (tx_hash: string) => Observer.checkConfirmed(tx_hash))

        logger.info(`[${process.env.name}] Block #${block_number} parsed | ${txs.length} USDT transfers`)

    }

    Observer.setOnNewBlock(onNewBlock)

    await Observer.start()

    logger.info(`[${process.env.name}] Observer started!`)

}

start()


process.on('uncaughtException', (error) => {
    console.log('!!! Worker uncaughtException !!!', '\n' , error)
})