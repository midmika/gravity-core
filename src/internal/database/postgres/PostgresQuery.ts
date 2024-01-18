import {Client} from "pg";

class PostgresQuery {
    readonly client: Client
    constructor(client: Client) {
        this.client = client
    }
}

export default PostgresQuery