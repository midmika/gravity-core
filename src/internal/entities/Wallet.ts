import { ethers } from "ethers"
import {inject, injectable} from "inversify";
import TOKENS from "../../inversify.tokens";
import {TTransactionCredentials} from "../../types/index.type";

@injectable()
class Wallet {

    @inject(TOKENS.mnemonic) private readonly mnemonic: string

    generateCredentials(account_id: number, networks: {name: string, type: string}[]): TTransactionCredentials[] {
        return networks.map(({ name, type }): TTransactionCredentials => {
            if(!this[type])
                throw new Error(`AddressProcessor for '${type}' network doesnt exists`)

            return { address: this[type](account_id), network: name }
        })
    }

    Ethereum(depth: number): string {
        const EthWallet: ethers.HDNodeWallet = ethers
            .HDNodeWallet
            .fromPhrase(this.mnemonic, void 0, 'm/44\'/60\'/0\'/0')

        return EthWallet.deriveChild(depth).address.toLowerCase()
    }

}


export default Wallet