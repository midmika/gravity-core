import {
    TCacheQueueInfo,
    TFoundTransaction,
} from "../../types/index.type";
import Account from "./Account";
import ResistError from "../decorators/ResistError";
import {container} from "../../inversify.config";
import TOKENS from "../../inversify.tokens"
import {inject, injectable} from "inversify"
import ConfirmationQueue from "./ConfirmationQueue"
import AbstractMessenger, {
    EMessengerType,
    TMessengerTransactionFound,
    TMessengerTransactionConfirmed,
    TMessengerTransactionRejected
} from "../messenger/AbstractMessenger"


@injectable()
class ObserveHelper {

    @inject(TOKENS.messenger)
    private readonly messenger: AbstractMessenger

    @inject(TOKENS.network_name)
    private readonly network_name: string

    @inject(TOKENS.confirmation_count)
    private readonly confirmation_count: number


    @ResistError(void 0)
    async aggregateCandidates (
        txs: TFoundTransaction[]
    ): Promise<any>
    {

        try {

            const account: Account = container.get(Account)

            const addresses_list: string[] = txs.map(i => i.address)

            // Транзакции, которые есть в кэше
            const found_credentials: string[] = await account.checkCandidateAddresses(
                this.network_name,
                addresses_list
            )

            await Promise.allSettled(
                found_credentials.map( async (address: string) => {

                    const tx_info: TFoundTransaction = txs.find(i => i.address === address)

                    await this.messenger.emit<TMessengerTransactionFound>(
                        EMessengerType.transaction_found,
                        { network_name: this.network_name, tx_info, confirmations_count: this.confirmation_count }
                    )

                })
            )

        } catch (error) {
            console.log(error)
        }

    }

    @ResistError(void 0)
    async checkConfirmationQueue (
        current_block_number: number,
        callback: (tx_hash: string) => Promise<void>
    ): Promise<void>
    {

        const confirmationQueue = container.get(ConfirmationQueue)

        const queue: TCacheQueueInfo[] = await confirmationQueue.get(this.network_name, current_block_number)

        // Проверяем, подтверждены ли транзакции
        const checkCallback = async (info: TCacheQueueInfo): Promise<void> =>
        {

            const message: TMessengerTransactionConfirmed = {
                network_name: this.network_name,
                tx_id: info.tx_id,
                at_block_number: current_block_number
            }

            try{
                // Колбек выкинет ошибку, если транзакция не подтверждена
                await callback(info.tx_hash)
                await this.messenger.emit<TMessengerTransactionConfirmed>(EMessengerType.transaction_confirmed, message)
            } catch (error) {
                await this.messenger.emit<TMessengerTransactionRejected>(
                    EMessengerType.transaction_rejected, { ...message, reason: 'transaction unconfirmed'}
                )
            } finally {
                // Удаляем из очереди транзакцию
                await confirmationQueue.remove(this.network_name, info.tx_hash)
            }

        }

        await Promise.allSettled(queue.map(checkCallback))

        return void 0

    }

}

export default ObserveHelper