import {AbstractLogger} from "../AbstractLogger";


class BlankLogger implements AbstractLogger {
    async info(...args: any[]): Promise<void> { }
    async warning(cause: string, message: string, metadata?: object | any, stack?: string): Promise<void> { }
    async error(cause: string, message: string, metadata?: object | any, stack?: string): Promise<void> { }
}

export default BlankLogger