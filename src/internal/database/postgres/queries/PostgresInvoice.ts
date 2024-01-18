import {AbstractInvoiceDatabase} from "../../AbstractDatabase";
import PostgresQuery from "../PostgresQuery";
import {
    EInvoiceStatus,
    TInvoice,
    TInvoiceLog
} from "../../../../types/index.type";
import {QueryResult} from "pg";
import {queries} from "../Postgres";


class PostgresInvoice extends PostgresQuery implements AbstractInvoiceDatabase {

    async create(
        invoice_id: string,
        account_id: number,
        payer_id: string,
        value: number,
        create_type: EInvoiceStatus
    ): Promise<string> {
        const result: QueryResult<{ id: string }> = await this.client.query(
            queries.invoice.create,
            [invoice_id, account_id, payer_id, value, create_type]
        )
        return result.rows[0].id
    }

    async updateStatus(
        invoice_id: string,
        to: EInvoiceStatus
    ): Promise<boolean> {
        const result: QueryResult = await this.client.query(
            queries.invoice.updateStatus,
            [invoice_id, to]
        )
        return result.rowCount === 1
    }

    async info(invoice_id: string): Promise<TInvoice | null> {
        const result: QueryResult<TInvoice> = await this.client.query(
            queries.invoice.info,
            [invoice_id]
        )
        if (!result.rowCount) return null
        return result.rows[0]
    }


    async log<T>(invoice_id: string, type: EInvoiceStatus, json: T): Promise<boolean> {
        const result: QueryResult = await this.client.query(
            queries.invoice.log,
            [invoice_id, type, json]
        )
        return result.rowCount === 1
    }

    async getLogs(invoice_id: string): Promise<TInvoiceLog<any>[] | null> {
        const result: QueryResult<TInvoiceLog<any>> = await this.client.query(
            queries.invoice.getLogs,
            [invoice_id]
        )
        if (!result.rowCount) return null
        return result.rows
    }

    async getIdByCredentials(address: string, network: string): Promise<string | null>
    {
        const result: QueryResult<{ invoice_id: string }> = await this.client.query(
            queries.invoice.getIdByCredentials,
            [address, network]
        )
        if (!result.rowCount) return null
        return result.rows[0].invoice_id
    }


}

export default PostgresInvoice