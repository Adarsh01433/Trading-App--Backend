import User from "../../models/User.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError, UnautheticatedError } from "../../errors/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// -------- Signup ----------
const register = async (req, res) => {
  const { email, password, register_token } = req.body;

  if (!email || !password || !register_token) {
    throw new BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ email });
  if (user) {
    throw new BadRequestError("User Already exists");
  }
  try {
    // Verify register token
    const payload = jwt.verify(register_token, process.env.REGISTER_SECRET);
    if (payload.email !== email) {
      throw new BadRequestError("Invalid register token");
    }
    const newUser = await User.create({ email, password });

    const access_token = newUser.createAccessToken();
    const refresh_token = newUser.createRefreshToken();
    res
      .status(StatusCodes.CREATED)
      .json({
        user: { email: newUser.email, userId: newUser.id },
        tokens: { access_token, refresh_token },
      });
  } catch (error) {
    console.error(error);
    throw new BadRequestError("Invalid Body");
  }
};

// -------- Login --------

const login = async (req, res)=> {
 const {email, password} = req.body;
 if(!email || !password) {
   throw new BadRequestError("Please provide all Values")
 }
 const user = await User.findOne({email})
 if(!user){
   throw new NotFoundError("Invalid Credentials");
 }
 const isPasswordCorrect = await user.comparePassword(password);
 if(!isPasswordCorrect){
   let message;

   if(user.blocked_until_password && user.blocked_until_password > new Date()){
      const remainingMinutes = Math.ceil(
         (user.blocked_until_password - new Date()) / (60 * 1000)
      );
      message = `Your Account is blocked for password. Please try again afetr ${remainingMinutes} minute(s).`;
   } 
   else {
      const attemptRemaining = 3- user.wrong_password_attempts;
      message = 
      attemptRemaining > 0
      ? `Invalid password, ${attemptRemaining} attempts remaining`
      : "Invalid Login Attempts exceeded. Please try after 30 minutes";
   }
           throw new UnautheticatedError(message)
 }

 const access_token = user.createAccessToken();
 const refresh_token = user.createRefreshToken();

   let phone_exist = false;
   let login_pin_exist = false;

   if(user.phone_number){
       phone_exist = true;
   }
   if(user.login_pin){
      login_pin_exist = true;
   }

   res.status(StatusCodes.OK).json({
      user : { name : user.name,email : user.email, userId : user._id,phone_exist, login_pin_exist },
     tokens : {access_token, refresh_token}
   })
   
}

 const refreshToken = async (req, res)=> {
   const {refresh_token, type} = req.body; 
      if(!type || !["scoket", "app"].includes(type) || !refresh_token){
         throw new BadRequestError("Invalid body")
      }
 }


 async function  generateRefreshTokens(
   token,
   refresh_secret,
   refresh_expiry,
   access_secret,
   access_expiry
){
   try {
       const payload = jwt.verify(token. refresh_secret);
       const user = await User.findById(payload.userId);
       if(!user){
         throw new NotFoundError("User not found");
       }
       const access_token = jwt.sign(
         {userId : payload.userId},
         access_secret,
         {expiresIn : access_expiry}
       );
       const newRefreshToken = jwt.sign(
         {userId :payload.userId},
         refresh_secret,
         {expiresIn : refresh_expiry}     
       )
       return {access_token, newRefreshToken};
   } catch (error) {
      console.error(error);
      throw new UnautheticatedError("Invalid Token")
   }

 }


export {register, login}
