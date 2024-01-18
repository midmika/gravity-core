import {container} from "../inversify.config";
import Invoice from "../internal/entities/Invoice";
import {uid} from "uid";
import {TNetworkConfig} from "../types/index.type";
import {fileURLToPath} from "node:url";
import path from "path";
import fs from "node:fs";
import Network from "../internal/entities/Network";
import Migrate from "../internal/entities/Migrate";
import "dotenv/config"
import __init__ from "./__init__";

const mode = process.argv[process.argv.length - 1]






const init = async () => {

    const end = await __init__()

    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const base_dir = path.join(__dirname, '..', '..')

    const configs: TNetworkConfig[] = JSON.parse(fs.readFileSync(path.join(base_dir, 'networks.json'), 'utf8'))

    const network = container.get(Network)
    const migrate = container.get(Migrate)

    await migrate.migrate()

    for(const config of configs) {
        await network.add(config)
        await network.toggleActive(config.name, true)
    }

    await end()
    console.log('Done.')

}

const createTestInvoice = async () => {

    const end = await __init__()

    const invoice = container.get(Invoice)

    const payer_id = uid(16)
    const value = 0.01

    const { invoice_id, credentials } = await invoice.create(payer_id, value)

    console.log(`Invoice ${invoice_id} created`)
    console.log(`Payer ID: ${payer_id} | ${value} USDT | Expire at ${new Date().toLocaleString()}`)

    console.log('============= Credentials =============')
    for(const _ of credentials) console.log(`[${_.network}] ${_.address}`)
    console.log('=======================================')

    await end()

}

switch (mode) {
    case 'init': init(); break;
    case 'cinvoice': createTestInvoice(); break;
    default: throw new Error(`Unknown command ${mode}`)
}

