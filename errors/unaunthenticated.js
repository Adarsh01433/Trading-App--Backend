import { StatusCodes } from "http-status-codes";
import CustomAPIError from "./custom-api.js";


class UnautheticatedError extends CustomAPIError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.UNAUTHORIZED
    }
}

export default UnautheticatedError