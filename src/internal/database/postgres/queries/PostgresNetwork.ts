import {
    AbstractNetworkDatabase,
} from "../../AbstractDatabase";
import {queries} from "../Postgres";
import {QueryResult} from "pg";
import PostgresQuery from "../PostgresQuery";
import {TNetworkConfig} from "../../../../types/index.type";


class PostgresNetwork extends PostgresQuery implements AbstractNetworkDatabase {

    async add(config: TNetworkConfig): Promise<boolean> {

        const params = [
            config.name, config.type, config.endpoint, config.contract_address, config.confirmation_count, false
        ]

        const result: QueryResult = await this.client.query(queries.network.add, params)

        return result.rowCount === 1

    }

    async toggleActive(name: string, value: boolean): Promise<boolean> {
        const result: QueryResult = await this.client.query(queries.network.toggleActive, [name, value])
        return result.rowCount === 1
    }

    async getAll(): Promise<(TNetworkConfig & { is_active: boolean })[]> {
        const result: QueryResult<TNetworkConfig & { is_active: boolean }> = await this.client.query(
            queries.network.getAll
        )
        return result.rows
    }

    async get(is_active: boolean): Promise<(TNetworkConfig & { is_active: boolean })[]> {
        const result: QueryResult<TNetworkConfig & { is_active: boolean }> = await this.client.query(
            queries.network.get, [is_active]
        )
        return result.rows
    }

}

export default PostgresNetwork