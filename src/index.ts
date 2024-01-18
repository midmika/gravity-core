import "reflect-metadata"
import 'dotenv/config'

import {container} from "./inversify.config"
import TOKENS from "./inversify.tokens"


import AbstractMessenger, {
    EMessengerType,
    TMessengerTransactionConfirmed,
    TMessengerTransactionFound,
    TMessengerTransactionRejected
} from "./internal/messenger/AbstractMessenger"
import { AbstractLogger } from "./internal/logger/AbstractLogger"

import Invoice from "./internal/entities/Invoice"
import Network from "./internal/entities/Network"
import Account from "./internal/entities/Account"
import Transaction from "./internal/entities/Transaction";

import inversifyInit from "./inversify.init"
import run_worker from "./worker"


const index = async () => {

    await inversifyInit()

    const invoice: Invoice = container.get(Invoice)
    const account: Account = container.get(Account)
    const transaction: Transaction = container.get<Transaction>(Transaction)
    const logger: AbstractLogger = container.get<AbstractLogger>(TOKENS.logger)
    const messenger: AbstractMessenger = container.get<AbstractMessenger>(TOKENS.messenger)


    const onTransactionFound = async (data: TMessengerTransactionFound) => {

        const { network_name, tx_info, confirmations_count } = data

        logger.info(
            `[${network_name}] New incoming transaction to ${tx_info.address}` +
            ` | ${tx_info.value} USDT | ${tx_info.hash}`
        )

        const invoice_id: string | null = await invoice.getIdByCredentials(tx_info.address, network_name)

        if(!invoice_id) {
            logger.warning('onTransactionFound', 'Unknown transaction (no invoice)', data)
            return void 0
        }

        const tx_id: string | null = await transaction.create(
            invoice_id,
            network_name,
            tx_info.block_number + confirmations_count,
            tx_info
        )

        if(!tx_id) return void 0

        // TODO: notify

    }

    const onTransactionConfirmed = async (data: TMessengerTransactionConfirmed) => {

        const { tx_id, at_block_number} = data

        const invoice_id: string | null = await transaction.confirm(tx_id, at_block_number)

        if(!invoice_id) return void 0

        try{
            await invoice.pay(invoice_id, data.tx_id)
        } catch (error){
            logger.warning('Paid invoice', error, data, error?.stack)
        }

        try{
            await account.deleteCredentials(invoice_id)
            await account.releaseAccount(invoice_id)
        } catch (error) {
            logger.warning('Cleanup', error, data, error?.stack)
        }

        // TODO: notify

    }


    const onTransactionRejected = async (data: TMessengerTransactionRejected) => {

        const { tx_id, reason} = data

        const invoice_id: string | null = await transaction.reject(tx_id, reason)
        if(!invoice_id) return void 0

        // TODO: notify

    }

    // Подписываемся на события транзакций
    await messenger.on<TMessengerTransactionFound>(EMessengerType.transaction_found, onTransactionFound)
    await messenger.on<TMessengerTransactionConfirmed>(EMessengerType.transaction_confirmed, onTransactionConfirmed)
    await messenger.on<TMessengerTransactionRejected>(EMessengerType.transaction_rejected,onTransactionRejected)

    const network: Network = container.get(Network)
    const networks = await network.get('active')
    for(const network of networks) run_worker(network)

}

index()
