import {
    AbstractMigrateDatabase,
} from "../../AbstractDatabase";
import PostgresQuery from "../PostgresQuery";
import {queries} from "../Postgres";


class PostgresMigrate extends PostgresQuery implements AbstractMigrateDatabase {

    async migrate(): Promise<void> {
        await this.client.query(queries.$.wipeAndCreate)
    }

}

export default PostgresMigrate