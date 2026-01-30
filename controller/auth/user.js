import User from "../../models/User.js"
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import { BadRequestError, NotFoundError, UnautheticatedError } from "../../errors/index.js"
import bcrypt from "bcryptjs"

// Basically this is for account manangememt

const updateProfile = async(req, res)=> {
    const {name, gender, date_of_birth} = req.body;
    const accessToken = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const userId = decoded.userId;

    const updatedFields = {};
    // Sirf wahi fields update karo jo user ne bheji hain
    if(name) updatedFields.name = name;
    if(gender) updatedFields.gender = gender;
    if(date_of_birth) updatedFields.date_of_birth = date_of_birth

    const updatedUser = await User.findByIdAndUpdate(
        userId ,
        updatedFields,
        {new : true , runValidators : true, select : '-passowrd -biometricKey -login_pin'}
    )
    if(!updatedUser){
        throw new NotFoundError(`NO user with id : ${userId}`)
    }
    res.status(StatusCodes.OK).json({sucess : true, data : updatedUser})
}

const setLoginPinFirst = async(req, res)=> {
  const {login_pin} = req.body
  if(!login_pin || login_pin.length !== 4){
    throw new BadRequestError("Login pin must be 4 digits");
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)

  // 5️⃣ find userId from token beckend find not from fronyend
  const userId = decoded.userId;

  // find user
  const  user = await User.findById(userId);
  if(!user){
    throw new NotFoundError(`No user with user id : ${userId}`)
  }
  // if login pin set
  if(user.login_pin){
    throw new BadRequestError("Login pin alreadt set")
  }
  
  // 
  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(login_pin, salt);

  // update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {login_pin : hashedPin},
    {new : true, runValidators : true}
  );
 
  // bcs its first time
  const access_token = await jwt.sign(
    {userId : userId},
    process.env.SOCKET_TOKEN_SECRET,
    {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
  )

  const refresh_token = await jwt.sign(
    {userId : userId},
    process.env.REFRESH_SOCKET_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_SOCKET_TOKEN_EXPIRY,
    }
  )

  res.status(StatusCodes.OK)
  .json({
    success : true,
    socket_tokens:{
        socket_access_token: access_token,
        socket_refresh_token : refresh_token,
    }
  });

}; 

const verifyPin = async(req, res)=> {
  const {login_pin} =req.body;
  if(!login_pin || login_pin.length !== 4){
    throw new BadRequestError("LOgin pin must be 4 digits");
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  const userId = decoded.userId;

  const user = await User.findById(userId);
  if(!user){
    throw new NotFoundError(`No user with id : ${userId}`);
  }

  if(!user.login_pin){
    throw new BadRequestError("Login pin not set");
  }

  const isVerifyingPin = await user.comparePIN(login_pin);
  if(!isVerifyingPin){
  let message;

  if(user.blocked_until_pin && user.blocked_until_pin < new Date()){
    const blockedTime = Math.ceil((user.blocked_until_pin - new Date())/ 60000); // in min
    message = `Please try again after ${blockedTime} minutes`;
  } else {
      const attemptsRemaining = 3-user.wrong_pin_attempts;
      message = attemptsRemaining > 0 ? `Wrong PIN ${attemptsRemaining} attempts remaining.` : 'You have been blocked due to multiple wrong attempts. Please try again after 30 minutes'
  }
  throw new UnautheticatedError(message);

}
 const access_token = await jwt.sign(
  {userId : userId},
  process.env.SOCKET_TOKEN_SECRET,
  {expiresIn : process.env.REFRESH_TOKEN_EXPIRY}
 );

 const refresh_token = await jwt.sign(
  {userId : userId},
  process.env.REFRESH_SOCKET_TOKEN_SECRET,
  {expiresIn : process.env.REFRESH_SOCKET_TOKEN_EXPIRY},
 );

 res.status(StatusCodes.OK).json({
  sucess : true,
  socket_tokens : {
    socket_access_token : access_token,
    socket_refresh_token : refresh_token,
  },
 });
};


const getProfile = async(req,res)=> {
  const accessToken = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  const userId = decoded.userId;

  const user = await User.findById(userId).select("-password -biometricKey");
  if(!user){
    throw new NotFoundError(`No user with is : ${userId}`);
  }

  let pinExists = false;
  let phoneExists = false;
  if(user.login_pin) pinExists = true;
  if(user.phone_number) phoneExists = true;



  res.status(StatusCodes.OK).json({
    userId : user.id,
    email : user.email,
    phone_exist : phoneExists,
    name : user.name,
    login_pin_exist : pinExists,
    balance : user.balance.toFixed(2),
  });
}


export {updateProfile, setLoginPinFirst, verifyPin, getProfile};

  
  




