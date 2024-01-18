import 'reflect-metadata'
import {container} from "../inversify.config";

import 'dotenv/config'
import test, {it} from 'node:test';

import AbstractDatabase from "../internal/database/AbstractDatabase";
import AbstractCache from "../internal/cache/AbstractCache";
import Redis from "../internal/cache/redis/Redis";

import Postgres from "../internal/database/postgres/Postgres";
import ConsoleLogger from "../internal/logger/console/ConsoleLogger";
import TOKENS from "../inversify.tokens";
import {AbstractLogger} from "../internal/logger/AbstractLogger";
import Wallet from "../internal/entities/Wallet";
import assert from "node:assert";
import {
    EInvoiceStatus, ETransactionStatus,
    TInvoice,
} from "../types/index.type";
import Invoice from "../internal/entities/Invoice";
import Account from "../internal/entities/Account";
import ObserveHelper from "../internal/entities/ObserveHelper";
import AbstractMessenger from "../internal/messenger/AbstractMessenger";
import RedisMessenger from "../internal/messenger/redis/RedisMessenger";
import Transaction from "../internal/entities/Transaction";
import ConfirmationQueue from "../internal/entities/ConfirmationQueue";


let database: AbstractDatabase
let cache: AbstractCache
let messenger: AbstractMessenger


test('Initial', async (t) => {

    database = await Postgres.connect()
    cache = await Redis.connect()
    messenger = await RedisMessenger.connect()

    container.bind<AbstractDatabase>(TOKENS.database).toConstantValue(database)
    container.bind<AbstractCache>(TOKENS.cache).toConstantValue(cache)
    container.bind<AbstractMessenger>(TOKENS.messenger).toConstantValue(messenger)
    container.bind<AbstractLogger>(TOKENS.logger).toConstantValue(new ConsoleLogger())
    container.bind<string>(TOKENS.mnemonic).toConstantValue(process.env.MNEMONIC)

    container.bind<string>(TOKENS.network_name).toConstantValue('Polygon')
    container.bind<number>(TOKENS.confirmation_count).toConstantValue(10)

})

test('Wallet', async (t) => {

    const wallet: Wallet = container.get(Wallet)

    await it('Ethereum', () => {
        assert.equal(wallet.Ethereum(0), '0x1487E3Ee068d2eB44802A556F7F80C099D05Cc08'.toLowerCase())
        assert.equal(wallet.Ethereum(5), '0xE91E50042ecb6a1B29591691113e98A22C1E7490'.toLowerCase())
    })

})


/* Transaction emulation */


const value = 100
const payer_id = 'payer50135198'
const confirmation_count = 10
const network = 'Polygon'


const checkInvoiceStatus = async (invoice_id: string, expected_status: EInvoiceStatus) => {
    const invoice = container.get(Invoice)
    const info = await invoice.info(invoice_id)
    assert(info)
    assert(info.status === expected_status)
}


test('Transaction emulation [success]', async () => {

    const invoice = container.get(Invoice)
    const processor = container.get(ObserveHelper)
    const account = container.get(Account)
    const transaction = container.get(Transaction)
    const confirmationQueue = container.get(ConfirmationQueue)

    let invoice_id: string
    let credentials

    const tx_info = {
        address: '',
        hash: 'test_hash_0915012845109',
        block_number: 0,
        value: 200
    }

    await it('Create invoice', async () => {
        const data = await invoice.create(payer_id, value)
        assert.ok(data.invoice_id)
        assert.ok(data.credentials.length)
        invoice_id = data.invoice_id
        credentials = data.credentials
        tx_info.address = credentials[0].address
        await checkInvoiceStatus(invoice_id, EInvoiceStatus.processed)
    })

    await it('Get invoice info', async () => {
        const invoice_result: TInvoice | void = await invoice.info(invoice_id)
        assert.ok(invoice_result)
        assert.equal(invoice_result.payer_id, payer_id)
        assert.equal(invoice_result.value, value)
        assert.equal(invoice_result.status, EInvoiceStatus.processed)
    })

    await it('Get credentials', async () => {
        const _credentials = await account.getCredentials(invoice_id)
        assert.deepStrictEqual(credentials, _credentials)
    })

    await it('Check cached credentials', async () => {
        const found = await account.checkCandidateAddresses(
            'Polygon',
            ['0x6a5032dd9dbe88166f594d201d8499cb3f3880f9']
        )
        assert(found && found.length)
        assert(found.some(i => i === '0x6a5032dd9dbe88166f594d201d8499cb3f3880f9'))
    })

    await it('Create transaction below the expected amount [expected Error]', async () => {
        const _ = await transaction.create(
            invoice_id,
            'Polygon',
            10,
            { ...tx_info, value: 0 }
        )
        assert.equal(_, null)
    })

    await it('Create transaction, that it will be rejected by blockchain [expected Error]', async () => {
        const tx_id = await transaction.create(invoice_id, 'Polygon', 10, tx_info)
        await transaction.reject(tx_id, 'test')
        const info = await transaction.info(tx_id)
        assert.equal(info.status, ETransactionStatus.rejected)
    })

    let tx_id: string

    await it('Create transaction [normal]', async () => {
        tx_id = await transaction.create(invoice_id, 'Polygon', 10, tx_info)
        assert.ok(tx_id)
    })

    await it('Confirmation queue', async () => {
        const q = await confirmationQueue.get('Polygon', confirmation_count)
        assert(q[0].tx_id, tx_id)
    })

    await it("Confirm", async () => {
        await transaction.confirm(tx_id, 1)
    })

    await it('Pay for invoice', async () => {
        await invoice.pay(invoice_id, tx_id)
        await checkInvoiceStatus(invoice_id, EInvoiceStatus.paid)
    })

    await it('Acknowledge', async () => {
        await invoice.acknowledge(invoice_id)
        await checkInvoiceStatus(invoice_id, EInvoiceStatus.acknowledged)
    })

    await it('Delete credentials', async () => {
        await account.deleteCredentials(invoice_id)
        await account.releaseAccount(invoice_id)
        const credentials = await account.getCredentials(invoice_id)
        assert.deepStrictEqual(credentials, [])
    })

})


test('Disconnect', async () => {
    await database.disconnect()
    await cache.disconnect()
    await messenger.disconnect()
})