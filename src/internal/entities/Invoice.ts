import {
    EInvoiceStatus,
    ETransactionStatus,
    TTransactionCredentials,
    TInvoice,
    TInvoiceLog,
    TInvoiceLogAcknowledge,
    TInvoiceLogProcessed,
    TInvoiceLogPaid,
    TInvoiceLogUnpaid,
    TNetworkConfig,
    TTransaction,
} from "../../types/index.type";
import {Container, inject, injectable} from "inversify";
import TOKENS from "../../inversify.tokens";

import AbstractDatabase from "../database/AbstractDatabase";
import Account from "./Account";
import {createContainer} from "../../inversify.config";
import {uid} from "uid";
import Network from "./Network";
import Wallet from "./Wallet";
import {AbstractLogger} from "../logger/AbstractLogger";
import Transaction from "./Transaction";


@injectable()
class Invoice {

    @inject(TOKENS.database)
    private readonly database: AbstractDatabase
    @inject(TOKENS.logger)
    private readonly logger: AbstractLogger


    async create(
        payer_id: string,
        value: number
    ): Promise<{ invoice_id: string, credentials: TTransactionCredentials[] }>
    {

        const callback = async (
            database: AbstractDatabase
        ): Promise<{ invoice_id: string, credentials: TTransactionCredentials[] }> =>
        {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })
            const invoice: Invoice = temp_container.get(Invoice)
            const account: Account = temp_container.get(Account)
            const network: Network = temp_container.get(Network)
            const wallet: Wallet = temp_container.get(Wallet)

            const invoice_id: string = uid(60)

            // Резервируем аккаунт
            const account_id: number = await account.reserveAccount(invoice_id)

            // Создаем инвойс
            await database.invoice.create(invoice_id, account_id, payer_id, value, EInvoiceStatus.processed)

            const networks: TNetworkConfig[] = await network.get('active')
            if(!networks.length) throw new Error(`Cannot create credentials, 0 active networks`)

            const credentials: TTransactionCredentials[] = wallet.generateCredentials(
                account_id, networks.map(i => ({ name: i.name, type: i.type }))
            )

            // Добавляем credentials в кэш
            await account.setCredentials(invoice_id, credentials)

            await invoice.log<TInvoiceLogProcessed>(invoice_id, {
                type: EInvoiceStatus.processed,
                json: { account_id, credentials }
            })

            return { invoice_id, credentials }

        }

        const { error, result} = await this.database
            .useTransaction<{ invoice_id: string, credentials: TTransactionCredentials[] }>(callback)

        if(error) {

            this.logger.error(
                'Create invoice', error.message,
                { payer_id, value }, error?.message
            )

            throw error

        }

        this.logger.info(`Invoice '${result.invoice_id}' created`)

        return result

    }


    async pay(
        invoice_id: string,
        tx_id: string
    ): Promise<string>
    {

        const callback = async (
            database: AbstractDatabase
        ): Promise<string> =>
        {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })
            const invoice: Invoice = temp_container.get(Invoice)
            const transaction: Transaction = temp_container.get(Transaction)

            const invoice_info: TInvoice = await this.info(invoice_id)
            if(invoice_info.status !== EInvoiceStatus.processed)
                throw new Error(`invoice has status: ${invoice_info.status}`)

            const tx_info: TTransaction = await transaction.info(tx_id)
            if(tx_info.status !== ETransactionStatus.confirmed)
                throw new Error(`transaction has status: ${tx_info.status}`)

            if(Date.now() > invoice_info.expired_at)
                throw new Error('invoice expired')

            await invoice.updateStatus(invoice_id, EInvoiceStatus.paid)

            await invoice.log<TInvoiceLogPaid>(invoice_id, {
                type: EInvoiceStatus.paid,
                json: { tx_id }
            })

            return tx_id

        }

        const { error, result} = await this.database.useTransaction<string>(callback)

        if(error) {

            this.logger.error(
                'Create invoice', error.message,
                { invoice_id, tx_id }, error?.message
            )

            throw error

        }

        this.logger.info(
            `Invoice '${invoice_id}' updated status:`, EInvoiceStatus.processed, '->', EInvoiceStatus.paid
        )

        return result

    }

    async unpaid(invoice_id: string): Promise<void>
    {

        const callback = async (database: AbstractDatabase): Promise<void> => {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })
            const invoice: Invoice = temp_container.get(Invoice)

            const invoice_info: TInvoice = await invoice.info(invoice_id)

            if(invoice_info.status !== EInvoiceStatus.processed)
                throw new Error(`invoice has status: ${invoice_info.status}`)

            await invoice.updateStatus(invoice_id, EInvoiceStatus.unpaid)

            await invoice.log<TInvoiceLogUnpaid>(invoice_id, {
                type: EInvoiceStatus.unpaid,
                json: {}
            })

            return void 0

        }

        const { error, result} = await this.database
            .useTransaction<void>(callback)

        if(error) {

            this.logger.error(
                'Unpaid invoice', error.message,
                { invoice_id }, error?.message
            )

            throw error

        }

        this.logger.info(
            `Invoice '${invoice_id}' updated status:`, 'any', '->', EInvoiceStatus.unpaid
        )

        return result

    }

    async acknowledge(invoice_id: string): Promise<void>
    {

        const callback = async (
            database: AbstractDatabase
        ): Promise<void> =>
        {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })
            const invoice: Invoice = temp_container.get(Invoice)

            const info: TInvoice = await invoice.info(invoice_id)
            if(!info) throw new Error(`invoice doesnt exists`)

            if(info.status !== EInvoiceStatus.paid)
                throw new Error(`cannot acknowledge invoice, current status: ${info.status}`)

            await this.database.invoice.updateStatus(
                invoice_id,
                EInvoiceStatus.acknowledged
            )

            await invoice.log<TInvoiceLogAcknowledge>(invoice_id, {
                type: EInvoiceStatus.acknowledged,
                json: {}
            })

        }

        const { error, result} = await this.database.useTransaction<void>(callback)

        if(error) {

            this.logger.error(
                'Acknowledge invoice', error.message,
                { invoice_id }, error?.message
            )

            throw error

        }

        this.logger.info(
            `Invoice '${invoice_id}' updated status:`, EInvoiceStatus.paid, '->', EInvoiceStatus.acknowledged
        )

        return result

    }

    async info(invoice_id: string): Promise<TInvoice | null>
    {
        return await this.database.invoice.info(invoice_id)
    }

    async getIdByCredentials(address: string, network: string): Promise<string | null>
    {
        return await this.database.invoice.getIdByCredentials(address, network)
    }


    private async updateStatus(invoice_id: string, to: EInvoiceStatus): Promise<boolean>
    {
        return await this.database.invoice.updateStatus(invoice_id, to)
    }

    private async log<T>(invoice_id: string, data: TInvoiceLog<T>): Promise<void> {
        await this.database.invoice.log(invoice_id, data.type, data.json)
    }

}


export default Invoice