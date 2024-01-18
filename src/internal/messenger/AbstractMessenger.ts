import {TFoundTransaction} from "../../types/index.type";


export default abstract class AbstractMessenger {
    abstract disconnect(): Promise<void>
    abstract on<T>(type: EMessengerType, callback: (data: T) => any | Promise<any>): Promise<void>
    abstract emit<T>(type: EMessengerType, data: T): Promise<void>
}

export type TMessengerTransactionFound = {
    network_name: string,
    confirmations_count: number
    tx_info: TFoundTransaction
}

export type TMessengerTransactionConfirmed = {
    network_name: string,
    tx_id: string,
    at_block_number: number
}

export type TMessengerTransactionRejected = TMessengerTransactionConfirmed & {
    reason: string,
}

export type TMessengerTransactionConfirmationInfo = {
    [invoice_id: string]: {
        current: number,
        target: number
    }
}



export enum EMessengerType {
    transaction_found = 'transaction_found',
    transaction_confirmed = 'transaction_confirmed',
    transaction_rejected = 'transaction_rejected',
    transaction_confirmation_info = 'transaction_confirmation_info'
}