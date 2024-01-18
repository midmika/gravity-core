import {
    EInvoiceStatus,
    ETransactionStatus,
    TTransactionCredentials,
    TInvoice,
    TInvoiceLog,
    TNetworkConfig,
    TTransaction,
} from "../../types/index.type"



/* ==================== Invoice ==================== */
export abstract class AbstractInvoiceDatabase {
    abstract create(
        invoice_id: string,
        account_id: number,
        payer_id: string,
        value: number,
        create_type: EInvoiceStatus
    ): Promise<string>
    abstract updateStatus(invoice_id: string, to: EInvoiceStatus): Promise<boolean>
    abstract info(invoice_id: string): Promise<TInvoice | null>
    abstract log<T>(invoice_id: string, type: EInvoiceStatus, json: T): Promise<boolean>
    abstract getLogs(invoice_id: string): Promise<TInvoiceLog<any>[] | null>
    abstract getIdByCredentials(address: string, network: string): Promise<string | null>
}

/* ==================== Transaction ==================== */
export abstract class AbstractTransactionDatabase {
    abstract create(
        invoice_id: string,
        network: string,
        address: string,
        hash: string,
        value: number,
        create_status: ETransactionStatus
    ): Promise<string /* <- invoice_id */>
    abstract log<T>(tx_id: string, type: ETransactionStatus, json: T): Promise<boolean>
    abstract updateStatus(tx_id: string, to: ETransactionStatus): Promise<boolean>
    abstract info(tx_id: string): Promise<null | TTransaction>
}

/* ==================== Account ==================== */
export abstract class AbstractAccountDatabase {
    abstract setCredentials(invoice_id: string, address: string, network: string): Promise<void>
    abstract getCredentials(invoice_id: string): Promise<TTransactionCredentials[]>
    abstract deleteCredentials(invoice_id: string): Promise<boolean>
    abstract reserveAccount(invoice_id: string): Promise<number>
    // Особождает аккаунт от invoice_id, после чего его может взять другой invoice
    abstract releaseAccount(invoice_id: string): Promise<void>
}

/* ==================== Migrate ==================== */
export abstract class AbstractMigrateDatabase {
    abstract migrate(): Promise<void>
}

/* ==================== Network ==================== */
export abstract class AbstractNetworkDatabase {
    // false в случае, если сеть не получилось добавить
    abstract add(config: TNetworkConfig): Promise<boolean>
    // true - значение поменялось, false - сети 'name' нету
    abstract toggleActive(name: string, value: boolean): Promise<boolean>
    abstract getAll(): Promise<(TNetworkConfig & { is_active: boolean })[]>
    abstract get(is_active: boolean): Promise<(TNetworkConfig & { is_active: boolean })[]>
}



export default abstract class AbstractDatabase {
    // T - result type
    // Передается callback, в который передается инстанс БД (в случае с постгресом создается новое подключение),
    // в случае, если он не выбросил исключение, считаем, что транзация выполнена успешно
    abstract useTransaction<T>(
        callback: (database: AbstractDatabase) => Promise<T | never>
    ): Promise<TDatabaseTransactionResult<T>>
    abstract disconnect(): Promise<void>

    account: AbstractAccountDatabase
    migrate: AbstractMigrateDatabase
    transaction: AbstractTransactionDatabase
    network: AbstractNetworkDatabase
    invoice: AbstractInvoiceDatabase
}


export type TDatabaseQueries = {
    [key: string]: {
        [key: string]: string
    }
}

export type TDatabaseTransactionResult<T> = ({ error: Error, result: null } | { error: null, result: T })

