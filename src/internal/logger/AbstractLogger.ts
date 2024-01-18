export abstract class AbstractLogger {
    abstract info(...args: any[]): Promise<void> | void
    abstract warning(
        cause: string,
        message: string,
        metadata?: object | any,
        stack?: string
    ): Promise<void> | void
    abstract error(
        cause: string,
        message: string,
        metadata?: object | any,
        stack?: string
    ): Promise<void> | void
}

