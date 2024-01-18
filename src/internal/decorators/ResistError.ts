const ResistError = (return_on_error: any) =>
{

    return function (_: any, __: any, descriptor: PropertyDescriptor) {
        const method = descriptor.value
        descriptor.value = async function (...args: any[]) {
            try{
                return await method.apply(this, args)
            } catch (error){
                console.log(error)
                return return_on_error
            }
        }
        return descriptor
    }
}

export default ResistError