/*
    ==================== Invoice ====================
*/

export enum EInvoiceStatus {
    'processed' = 'processed', // processed - invoice создан
    'paid' = 'paid', // paid - транзакция подтверждена
    'unpaid' = 'unpaid', // unpaid - транзакция не оплачена в указанный срок
    'acknowledged' = 'acknowledged', // магазин подтвердил оплату
}

export type TInvoice = {
    id: string,
    payer_id: string,
    account_id: number,
    value: number,
    status: EInvoiceStatus
    created_at: number
    expired_at: number
}

export type TInvoiceLog<T> = { type: EInvoiceStatus, json: T }
export type TInvoiceLogProcessed = { account_id: number, credentials: TTransactionCredentials[] }
export type TInvoiceLogPaid = { tx_id: string }
export type TInvoiceLogUnpaid = {}
export type TInvoiceLogAcknowledge = {}


/*
    ==================== Transaction ====================
*/

export enum ETransactionStatus {
    'found' = 'found',
    'confirmed' = 'confirmed',
    'rejected' = 'rejected'
}

export type TTransaction = {
    id: string,
    invoice_id: string,
    address: string,
    network: string,
    hash: string,
    value: number,
    status: ETransactionStatus,
    created_at: number
}

export type TTransactionCredentials = { address: string, network: string }

export type TFoundCredentials = {
    address: string,
    invoice_id: string
}

export type TFoundTransaction = {
    address: string
    hash: string
    value: number
    block_number: number
}

export type TTransactionLog<T> = { type: ETransactionStatus, json: T }
export type TTransactionLogCreated = { tx_info: TFoundTransaction, network_name: string, invoice_id: string }
export type TTransactionLogConfirmed = { confirmed_at_block: number }
export type TTransactionLogRejected = { reason: string }
export type TTransactionConfirmationQueue = { [address: string]: { tx_id: string, tx_hash: string } }

/*
    ==================== Network  ====================
*/

export type TNetworkConfig = {
    name: string,
    type: ENetworkType,
    endpoint: string,
    contract_address: string
    confirmation_count: number,
}

export enum ENetworkType {
    'Ethereum' = 'Ethereum'
}

export type TWorkerEnv = {
    name: string,
    endpoint: string,
    contract_address: string,
    confirmation_count: number
}

export type TCacheQueueInfo = {
    tx_id: string,
    tx_hash: string
}