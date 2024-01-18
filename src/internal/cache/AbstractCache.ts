import {TCacheQueueInfo} from "../../types/index.type";

abstract class AbstractCache {
    abstract disconnect(): Promise<void>

    abstract setCredentials(address: string, network: string, invoice_id: string): Promise<void>
    abstract deleteCredentials(address: string, network: string): Promise<void>
    abstract getAllCredentials(network: string): Promise<string[]>

    abstract getInvoiceId(address: string, network: string): Promise<string | null>

    abstract addConfirmationQueue(
        network: string,
        target_block_number: number,
        tx_id: string,
        tx_hash: string
    ): Promise<void>
    abstract deleteConfirmationQueue(network: string, tx_hash: string): Promise<void>
    abstract getConfirmationQueue(network: string, target_block_number: number): Promise<TCacheQueueInfo[] | null>

    // wipe all data
    abstract flush(): Promise<void>
}

export default AbstractCache