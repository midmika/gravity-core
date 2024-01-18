import {AbstractAccountDatabase} from "../../AbstractDatabase";
import {TTransactionCredentials} from "../../../../types/index.type";
import {QueryResult} from "pg";
import {queries} from "../Postgres";
import PostgresQuery from "../PostgresQuery";

class PostgresAccount extends PostgresQuery implements AbstractAccountDatabase {

    async setCredentials(invoice_id: string, address: string, network: string): Promise<void> {
        await this.client.query(
            queries.invoice.createCredentials, [invoice_id, address, network]
        )
        return void 0
    }

    async getCredentials(invoice_id: string): Promise<TTransactionCredentials[]> {
        const result: QueryResult<{ address: string, network: string }> = await this.client.query(
            queries.invoice.getCredentials,
            [invoice_id]
        )
        return result.rows
    }

    async deleteCredentials(invoice_id: string): Promise<boolean> {
        const result: QueryResult<{ address: string, network: string }> = await this.client.query(
            queries.account.deleteCredentials,
            [invoice_id]
        )
        return !!result.rowCount
    }

    async reserveAccount(invoice_id: string): Promise<number | null> {

        // Reserve Exists
        const result_exists: QueryResult<{ id: number }> = await this.client.query(
            queries.account.reserveExistsAccount, [invoice_id]
        )
        if(result_exists.rowCount) return result_exists.rows[0].id

        // Reserve New
        const result_new: QueryResult<{ id: number }> = await this.client.query(
            queries.account.reserveNewAccount, [invoice_id]
        )
        return result_new.rows[0].id

    }

    async releaseAccount(invoice_id: string): Promise<void> {
        await this.client.query(queries.account.releaseAccount, [invoice_id])
    }


}

export default PostgresAccount