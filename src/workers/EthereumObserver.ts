import {BlockHeaderOutput, TransactionReceipt, Web3} from "web3"
import {TransactionInfo} from "web3-types";
import {TFoundTransaction} from "../types/index.type";


class EthereumObserver {

    private readonly web3: Web3
    private readonly contract_address: string

    private onNewBlock: (block_number: number, txs: TFoundTransaction[]) => Promise<void>

    constructor(endpoint: string, contract_address: string )
    {
        this.web3 = new Web3(endpoint)
        this.contract_address = contract_address
    }

    setOnNewBlock(callback: (block_number: number, txs: TFoundTransaction[]) => Promise<void>): void
    {
        this.onNewBlock = callback
    }

    async start(): Promise<void>
    {
        if(!this.onNewBlock) throw new Error('onNewBlock unspecified, use Observer.setOnNewBlock(...) ')
        const sub = await this.web3.eth.subscribe('newBlockHeaders')
        sub.on('data', block => this.handleBlock(block))
    }

    async checkConfirmed(tx_hash: string): Promise<void>
    {

        // Метод упадет, если транзакция не существует
        const transaction: TransactionReceipt =
            await this.web3.eth.getTransactionReceipt(tx_hash)

        if(!Boolean(transaction.status))
            throw new Error("transaction reverted by EVM")

        return void 0

    }

    /*
        Private Methods
     */

    private parseTransaction(transaction: TransactionInfo): TFoundTransaction | null
    {

        // transaction.to may be null
        if(transaction?.to !== this.contract_address) return null
        if(typeof transaction.input !== 'string') return null

        // Empty input maybe '0x' or '0x00'
        if(transaction.input?.length <= 4) return null

        const input: string = transaction.input
        if(!input.startsWith('0xa9059cbb')) return null

        const address_to: string = '0x' + transaction.input.slice(34, 74)
        const value_hex: string = transaction.input.slice(74, 138)
        const value_decimal: number = parseInt('0x' + value_hex)
        // 6 - USDT decimals
        const value: number = value_decimal / (10 ** 6)

        return {
            address: address_to,
            hash: transaction.hash as string,
            value,
            block_number: Number(transaction.blockNumber)
        }

    }

    private async handleBlock(block_header: BlockHeaderOutput): Promise<any>
    {

        const block_number = Number(block_header.number)
        const block = await this.web3.eth.getBlock(block_number, true)

        // Блок hydrated, гарантировано TransactionInfo[]
        const transactions: TransactionInfo[] = block?.transactions as TransactionInfo[] || []

        const txs: TFoundTransaction[] = transactions
            .map((tx: TransactionInfo): TFoundTransaction | null => {
                return this.parseTransaction(tx)
            })
            .filter(tx => tx !== null)

        await this.onNewBlock(block_number, txs)

    }


}

export default EthereumObserver