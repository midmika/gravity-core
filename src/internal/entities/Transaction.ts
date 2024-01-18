import {
    ETransactionStatus, TCacheQueueInfo,
    TFoundTransaction,
    TTransaction,
    TTransactionLog,
    TTransactionLogConfirmed, TTransactionLogCreated, TTransactionLogRejected
} from "../../types/index.type";
import AbstractDatabase from "../database/AbstractDatabase";
import Invoice from "./Invoice";
import {AbstractLogger} from "../logger/AbstractLogger"
import {createContainer} from "../../inversify.config";
import TOKENS from "../../inversify.tokens";
import {Container, inject, injectable} from "inversify";
import ConfirmationQueue from "./ConfirmationQueue";


@injectable()
class Transaction {

    @inject(TOKENS.database)
    private readonly database: AbstractDatabase

    @inject(TOKENS.logger)
    private readonly logger: AbstractLogger


    async create(
        invoice_id: string,
        network_name: string,
        confirmed_at_block: number,
        tx_info: TFoundTransaction
    ): Promise<string | null>
    {

        const callback = async (
            database: AbstractDatabase
        ): Promise<string> => {

            const container: Container = createContainer({ [TOKENS.database]: database })
            const invoice: Invoice = container.get(Invoice)
            const transaction: Transaction = container.get(Transaction)
            const confirmationQueue: ConfirmationQueue = container.get(ConfirmationQueue)

            const invoice_info = await invoice.info(invoice_id)
            if(!invoice_info)
                throw new Error('invoice doesnt exists')

            if(invoice_info.value > tx_info.value)
                throw new Error(`Tx has value: ${tx_info.value} USDT, expected ${invoice_info.value} USDT`)

            if(Date.now() > invoice_info.expired_at)
                throw new Error('invoice expired')

            const tx_id: string = await database.transaction.create(
                invoice_id, network_name, tx_info.address, tx_info.hash, tx_info.value, ETransactionStatus.found
            )

            await transaction.log<TTransactionLogCreated>(tx_id, {
                type: ETransactionStatus.found,
                json: { network_name, tx_info, invoice_id }
            })

            const queue: TCacheQueueInfo = {
                tx_id,
                tx_hash: tx_info.hash,
            }

            await confirmationQueue.add(network_name, confirmed_at_block, queue)

            return tx_id

        }

        const { error, result } = await this.database.useTransaction<string>(callback)

        if(error) {
            this.logger.error(
                'Create Transaction', error.message,
                { invoice_id, network_name, tx_info }, error?.stack
            )
            return null
        }

        this.logger.info(`Transaction '${result}' for invoice <${invoice_id}> created`)

        return result

    }

    async confirm (tx_id: string, confirmed_at_block: number): Promise<string | null>
    {

        const callback = async (database: AbstractDatabase): Promise<string> => {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })

            const transaction: Transaction = temp_container.get(Transaction)
            const tx_info: TTransaction = await transaction.info(tx_id)

            if(!tx_info)
                throw new Error(`transaction '${tx_id}' not found`)

            if(tx_info.status !== ETransactionStatus.found)
                throw new Error(`transaction has status: ${tx_info.status}`)

            await transaction.updateStatus(tx_id, ETransactionStatus.confirmed)

            await transaction.log<TTransactionLogConfirmed>(tx_id, {
                type: ETransactionStatus.confirmed,
                json: { confirmed_at_block }
            })

            return tx_info.invoice_id

        }

        const { error, result } = await this.database.useTransaction<string>(callback)

        if(error) {
            this.logger.error('Confirm Transaction', error.message, { tx_id }, error?.stack)
            return null
        }


        this.logger.info(`Transaction '${tx_id}' for invoice '${result}' confirmed`)

        return result

    }


    async reject (tx_id: string, reason: string): Promise<string | null>
    {

        const callback = async (database: AbstractDatabase): Promise<string> => {

            const temp_container: Container = createContainer({ [TOKENS.database]: database })
            const transaction: Transaction = temp_container.get(Transaction)

            const tx_info: TTransaction = await database.transaction.info(tx_id)

            if(tx_info.status === ETransactionStatus.rejected)
                throw new Error(`transaction already rejected`)

            await transaction.updateStatus(tx_id, ETransactionStatus.rejected)

            await transaction.log<TTransactionLogRejected>(tx_id, {
                type: ETransactionStatus.rejected,
                json: { reason }
            })

            return tx_info.invoice_id

        }

        const { error, result } = await this.database.useTransaction<string>(callback)

        if(error) {
            this.logger.error(
                'Abort Transaction', error.message,
                { tx_id, reason }, error?.stack
            )
            return null
        }

        this.logger.info(`Transaction '${tx_id}' for invoice '${result}' rejected`)

        return result

    }

    async updateStatus(tx_id: string, to: ETransactionStatus): Promise<boolean>
    {
        return await this.database.transaction.updateStatus(tx_id, to)
    }

    async log<T>(invoice_id: string, data: TTransactionLog<T>): Promise<void> {
        await this.database.transaction.log(invoice_id, data.type, data.json)
    }


    async info(tx_id: string): Promise<TTransaction> {
        return await this.database.transaction.info(tx_id)
    }

}

export default Transaction