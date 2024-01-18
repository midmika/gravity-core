import AbstractCache from "../cache/AbstractCache";
import {inject, injectable} from "inversify";
import TOKENS from "../../inversify.tokens";
import {TCacheQueueInfo} from "../../types/index.type";


@injectable()
class ConfirmationQueue {

    @inject(TOKENS.cache)
    private readonly cache: AbstractCache

    async add(
        network: string,
        target_block_number: number,
        queue: TCacheQueueInfo
    ): Promise<void>
    {
        await this.cache.addConfirmationQueue(network, target_block_number, queue.tx_id, queue.tx_hash)
    }

    async remove(network: string, tx_hash: string): Promise<void>
    {
        await this.cache.deleteConfirmationQueue(network, tx_hash)
    }

    async get(
        network: string,
        target_block_number: number
    ): Promise<TCacheQueueInfo[]>
    {
        return await this.cache.getConfirmationQueue(network, target_block_number)
    }

}

export default ConfirmationQueue