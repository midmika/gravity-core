import "reflect-metadata"
import {Container} from "inversify";
import Network from "./internal/entities/Network";
import Invoice from "./internal/entities/Invoice";
import Account from "./internal/entities/Account";
import Migrate from "./internal/entities/Migrate";
import Wallet from "./internal/entities/Wallet";
import Transaction from "./internal/entities/Transaction";
import ConfirmationQueue from "./internal/entities/ConfirmationQueue";
import ObserveHelper from "./internal/entities/ObserveHelper";


const base_container: Container = new Container()

base_container.bind<Migrate>(Migrate).to(Migrate)
base_container.bind<Wallet>(Wallet).to(Wallet)
base_container.bind<Network>(Network).to(Network)
base_container.bind<Account>(Account).to(Account)
base_container.bind<Transaction>(Transaction).to(Transaction)
base_container.bind<ConfirmationQueue>(ConfirmationQueue).to(ConfirmationQueue)
base_container.bind<Invoice>(Invoice).to(Invoice)
base_container.bind<ObserveHelper>(ObserveHelper).to(ObserveHelper)


const createContainer = (rebind_const: { [key: string]: any } = {}): Container => {

    const temp_container: Container = base_container.createChild()

    Object.entries(rebind_const).forEach((_) => {
        temp_container.bind(_[0]).toConstantValue(_[1])
    })

    return temp_container

}

export {
    base_container as container,
    createContainer
}