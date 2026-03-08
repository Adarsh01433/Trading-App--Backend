import jwt from "jsonwebtoken";
import { NotFoundError, UnautheticatedError } from "../errors/index.js"
import User from "../models/User.js"


const authenticateSocketuser = async(socket, next)=> {
    // check user

    try {
        const token = socket.handshake.headers.access_token
        if(!token){
            throw new UnautheticatedError("Authenticate invaid");
        }
        const decoded= jwt.verify(token, process.env.SOCKET_TOKEN_SECRET)

        if(!decoded){
            throw new UnautheticatedError("Invalid token");
        }

        const user = await User.findById(decoded.userId)
        if(!user){
            throw new NotFoundError("User not found");
        }
        socket.user = user
        next()
    } catch (error) {
        console.log("Socket authentication error:", error.message);
        
        next(new UnautheticatedError("Authentication error"))
    }
}
export default authenticateSocketuser;