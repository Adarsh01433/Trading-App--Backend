import jwt from "jsonwebtoken";
import { UnautheticatedError } from "../errors/index.js";


const auth = async(req, res, next)=> {
    // check user
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.headers.startWith("Bearer")){
     throw new UnautheticatedError('Authentication invalid')
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.SOCKET_TOKEN_SECRET)
        // attach the user to the job routes
        req.user = {userId : payload.userId, name : payload.name}
        next()
    } catch (error) {
        throw new UnautheticatedError('Authentication invalid')
    }
}
export default auth