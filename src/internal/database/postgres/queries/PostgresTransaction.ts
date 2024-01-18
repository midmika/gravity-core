import { AbstractTransactionDatabase,} from "../../AbstractDatabase";

import PostgresQuery from "../PostgresQuery";
import {QueryResult} from "pg";
import {queries} from "../Postgres";
import {ETransactionStatus, TTransaction} from "../../../../types/index.type";


class PostgresTransaction extends PostgresQuery implements AbstractTransactionDatabase {

    async create(
        invoice_id: string,
        network: string,
        address: string,
        hash: string,
        value: number,
        create_status: ETransactionStatus
    ): Promise<string>
    {

        const tx_result: QueryResult = await this.client.query(
            queries.transaction.create,
            [invoice_id, address, network, hash, value, create_status]
        )

        return tx_result.rows[0].id

    }

    async log<T>(tx_id: string, type: ETransactionStatus, json: T): Promise<boolean> {

        const result: QueryResult = await this.client.query(
            queries.transaction.log,
            [tx_id, type, json]
        )

        return result.rowCount === 1

    }

    async updateStatus(tx_id: string, to: ETransactionStatus): Promise<boolean> {

        const result: QueryResult = await this.client.query(
            queries.transaction.updateStatus,
            [tx_id, to]
        )

        return result.rowCount === 1

    }

    async info(tx_id: string): Promise<null | TTransaction> {

        const result: QueryResult<TTransaction> = await this.client.query(
            queries.transaction.info, [tx_id]
        )

        return result.rowCount ? result.rows[0] : null

    }


}

export default PostgresTransaction