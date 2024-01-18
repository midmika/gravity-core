import {TNetworkConfig} from "../../types/index.type";
import AbstractDatabase from "../database/AbstractDatabase";
import {inject, injectable} from "inversify";
import TYPES from "../../inversify.tokens";


@injectable()
class Network {

    @inject(TYPES.database)
    private readonly database: AbstractDatabase

    async add(config: TNetworkConfig): Promise<void> {
        const result: boolean = await this.database.network.add(config)
        if(!result) throw new Error(`Cannot add new network: ${config.name}`)
        return void 0
    }

    async toggleActive(name: string, value: boolean): Promise<void> {
        const result: boolean = await this.database.network.toggleActive(name, value)
        if(!result) throw new Error(`Cannot toggle network active: ${name}, maybe not exists`)
        return void 0
    }

    async get(type: 'all' | 'active' | 'nonactive'): Promise<(TNetworkConfig & { is_active: boolean })[]> {
        if(type === 'all') return this.database.network.getAll()
        return this.database.network.get(type === 'active')
    }

}


export default Network