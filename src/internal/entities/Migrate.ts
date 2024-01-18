import AbstractDatabase from "../database/AbstractDatabase";
import AbstractCache from "../cache/AbstractCache";
import {inject, injectable} from "inversify";
import TOKENS from "../../inversify.tokens";


@injectable()
class Migrate {

    @inject(TOKENS.database)
    private readonly database: AbstractDatabase
    @inject(TOKENS.cache)
    private readonly cache: AbstractCache

    async migrate(): Promise<void> {
        await this.database.migrate.migrate()
        await this.cache.flush()
    }

}

export default Migrate