class ApiError extends Error{
    constructor(
        message = "Something to be corrected",
        stack ="",
        statuscode,
        errors =[],
    ){
        super(message);
        this.errors = errors;
        this.statuscode = statuscode;
        this.data = null;
        this.success = false;
        this.message = message;
    
    if(stack){
        this.stack = stack
    }else{
            Error.captureStackTrace(this,this.constructor)
    }
}}

export {ApiError}