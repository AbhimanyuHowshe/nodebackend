class ApiResponse{
    constructor(statuscode, message = "Success",data ){
        this.message = message;
        this.statuscode = statuscode;
        this.data = data;
        this.success = success < 400;
    }

}
export {ApiResponse} ;