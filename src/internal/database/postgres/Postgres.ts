import pg, {Client} from 'pg'
import getQueries from "./getQueries"

import PostgresAccount from "./queries/PostgresAccount"
import PostgresMigrate from "./queries/PostgresMigrate"
import PostgresTransaction from "./queries/PostgresTransaction"

import AbstractDatabase, {
    AbstractAccountDatabase,
    AbstractInvoiceDatabase,
    AbstractMigrateDatabase,
    AbstractNetworkDatabase,
    AbstractTransactionDatabase, TDatabaseQueries, TDatabaseTransactionResult
} from "../AbstractDatabase"
import PostgresNetwork from "./queries/PostgresNetwork";
import PostgresInvoice from "./queries/PostgresInvoice";


// pg не умеет из коробки парсить bigint, который мне нужен для timestamp`ов
pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => parseInt(value))


const queries: TDatabaseQueries = getQueries()


const getClient = async (): Promise<Client> => {
    const pg_config = {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE
    }
    const client: Client = new pg.Client(pg_config)
    await client.connect()
    return client
}

class Postgres implements AbstractDatabase {

    private client: Client

    readonly account: AbstractAccountDatabase
    readonly migrate: AbstractMigrateDatabase
    readonly transaction: AbstractTransactionDatabase
    readonly network: AbstractNetworkDatabase
    readonly invoice: AbstractInvoiceDatabase


    constructor(client: Client)
    {
        this.client = client

        this.account = new PostgresAccount(client)
        this.migrate = new PostgresMigrate(client)
        this.transaction = new PostgresTransaction(client)
        this.network = new PostgresNetwork(client)
        this.invoice = new PostgresInvoice(client)

    }

    static async connect(): Promise<AbstractDatabase>
    {
        const client: Client = await getClient()
        return new Postgres(client)
    }

    async disconnect(): Promise<void>
    {
        await this.client.end()
    }

    async useTransaction<T, C>(
        callback: (instance: AbstractDatabase) => Promise<T | never>
    ): Promise<TDatabaseTransactionResult<T>>
    {

        // Создаем новое подключение
        const client: Client = await getClient()
        await client.query('begin transaction isolation level read committed')

        const response: TDatabaseTransactionResult<T> = {
            result: null,
            error: null
        }

        try{
            response.result = await callback(new Postgres(client))
            await client.query('commit transaction')
        } catch (_error) {
            response.error = _error
            await client.query('rollback transaction')
        } finally {
            await client.end()
        }

        return response

    }

}


export { queries }
export default Postgres
