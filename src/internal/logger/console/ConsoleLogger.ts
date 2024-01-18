import {AbstractLogger} from "../AbstractLogger";

class ConsoleLogger implements AbstractLogger {

    async info(...args: any[]): Promise<void> {
        console.log('🛈 INFO |',...args)
    }

    async warning(cause: string, message: string, metadata?: object | any, stack?: string): Promise<void> {
        const _ = ['⚠️ WARNING |', `[${cause}]`, message]
        // if(stack) _.push('\n', stack)
        if(metadata) _.push('\n', JSON.stringify(metadata, null, 4))
        console.log(..._)
    }

    async error(cause: string, message: string, metadata?: object | any, stack?: string): Promise<void> {
        const _ = ['🔴 ERROR |', `[${cause}]`, message]
        // if(stack) _.push('\n', stack)
        if(metadata) _.push('\n', JSON.stringify(metadata, null, 4))
        console.log(..._)
    }

}

export default ConsoleLogger