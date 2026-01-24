import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { mailSender } from "../services/mailSender.js";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5,
  },
  otp_type: {
    type: String,
    enum: ["phone", "email", "reset_password", "reset_pin"],
    required: true,
  },
});

otpSchema.pre("save", async function (next) {
   if(this.isNew){
    const salt = await bcrypt.genSalt(10);
    await sendVerificationMail(this.email, this.otp, this.otp_type);
    this.otp = await bcrypt.hash(this.otp, salt)
   }
   next()
});

otpSchema.methods.compareOtp = async function (enteredOtp){
  return await bcrypt.compare(enteredOtp, this.otp)
}

async function sendVerificationMail(email, otp, otp_type) {
  try {
     await mailSender(email, otp ,otp_type);
  } catch (error) {
    console.log(error)
    throw error;
    
  }
}




const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
