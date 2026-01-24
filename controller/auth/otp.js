import User from '../../models/User.js';
import OTP from "../../models/Otp.js";
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from "../../errors/index.js";
import {generateOTP} from '../../services/mailSender.js'
import { PassThroughClient } from 'google-auth-library';



const verifyOtp =  async (req, res)=> {
      const {email, otp, otp_type , data} = req.body;

      if(!email || !otp || !otp_type){
        throw new BadRequestError("Please provide all values");

  //👉 Agar OTP ka kaam sirf verify email hai
// → data ki zarurat nahi

// 👉 Agar OTP ka kaam kuch update karna hai
// (reset pin / password / phone)
// → data mandatory

      }else if( otp_type !== "email" && !data){
         throw new BadRequestError('Please provide all values');
      }

      const otpRecord = await OTP.findOne({email, otp_type}).sort({createdAt : -1}).limit(1);

      if(!otpRecord){
        throw new BadRequestError("Invalid OTP or OTP expired");
      }
      // otp → user ne jo OTP dala
      const isVerified = await otpRecord.compareOTP(otp);
      if(!isVerified){
        throw new BadRequestError('Invalid OTP or OTP expired');
      }
       // reuse allowed ❌
      await OTP.findByIdAndDelete(otpRecord.id);

    switch (otp_type){
        case  "phone" :
        await User.findOneAndUpdate({email}, {phone_number: data});
        break;

        case "email":
         break;

         case "reset_pin":
            if(!data || data.length != 4){
                throw new BadRequestError("PIN Should be 4 digit");
            }
            await User.updatePIN(email, data);
            break;

            case "reset_password" :
                await User.updatePassword(email, data);
                break;

                default :
                throw new BadRequestError("Invalid OTP request type")
    }

           const user = await User.findOne({email});
           
           // EMAIL OTP SPECIAL CASE (SIGNUP FLOW)
           if(otp_type === "email" && !user){
                const register_token = jwt.sign({email}, process.env.REGISTER_SECRET, {
                  expiresIn : process.env.REGISTER_SECRET_EXPIRY,
                });
                return res.status(StatusCodes.OK)
                .json({msg : "OTP verified sucessfully", register_token});
           }
           res.status(StatusCodes.OK).json({msg : "OTP verified sucessfully"})

} 

const sendOtp =async(req,res)=> {

 const {email, otp_type} = req.body;
 
if(!email || !otp_type){
  throw new BadRequestError("Please provide all values")
}
const user = await User.findOne({email});
 
if(!user && otp_type == 'phone'){
  throw new BadRequestError("User not found");
}

if(otp_type === "email" && user){
  throw new BadRequestError("User already exist")
}
if(otp_type === "phone" && user.phone_number){
  throw new BadRequestError("Phone number already exists")
}

const otp = await generateOTP();
const otpPayload = {email, otp, otp_type};
await OTP.create(otpPayload);

res.status(StatusCodes.OK).json({msg : "OTP sent sucessfully"})

 };

 export {verifyOtp, sendOtp}
