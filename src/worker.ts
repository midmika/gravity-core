import path from "path";
import url from "url";
import {ENetworkType, TNetworkConfig, TWorkerEnv} from "./types/index.type";
import child_process from "child_process";


const base_worker_path = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'workers')

const workers_path = {
    [ENetworkType.Ethereum]: path.join(base_worker_path, ENetworkType.Ethereum)
}

const run_worker = (config: TNetworkConfig) => {

    const worker_env: TWorkerEnv = {
        name: config.name,
        endpoint: config.endpoint,
        contract_address: config.contract_address,
        confirmation_count: config.confirmation_count
    }

    const env = Object.assign(process.env, worker_env)

    const worker = child_process.fork(
        workers_path[config.type],
        { env }
    )

    worker.on('error', (error) => {
        console.log('Worker #' + config.name, 'crashed with error', error)
    })

    worker.on('exit', (code) => {
        console.log('Worker #' + config.name, 'crashed with code', code)
    })

}

export default run_worker