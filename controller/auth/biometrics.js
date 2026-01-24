 
 import User from "../../models/User.js"
 import { StatusCodes } from "http-status-codes"
 import { BadRequestError, UnautheticatedError } from "../../errors/index.js"
 import NodeRSA from "node-rsa";
 import jwt from "jsonwebtoken";



 const uploadBiometric = async(req, res)=> {
  const {public_key} = req.body;
  if(!public_key){
    throw new BadRequestError("Email and Biometric are required")
  }

  const accessToken = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  const userId = decoded.userId;

  const updatedUser  = await User.findByIdAndUpdate(userId, {
    biometricKey : public_key
  }, {new : true,
    runValidators : true
  });

  res.status(StatusCodes.OK).json({msg : "Biometric key uploaded sucessfully"})
 }

 const verifyBiometric = async(req, res)=> {
  const { signature} = req.body;
  if(!signature){
    throw new BadRequestError("Signature is requied");
  }
  const accessToken = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  const userId = decoded.userId;
  const user = await User.findById(userId);

  if(!user.biometricKey) {
    throw new UnautheticatedError("Biometric key not found")
  }

  const isVerifyingSignature = new verifySignature(signature, userId, user.biometricKey);

  if(!isVerifyingSignature){
  throw new UnautheticatedError("Invalid signature");
  }

  const access_token =  await jwt.sign(
      {userId : userId},
      process.env.SOCKET_TOKEN_SECRET,
      {expiresIn : process.env.JWT_LIFETIME}
  );

  const refresh_token = await jwt.sign(
    {userId : userId},
    process.env.REFRESH_SOCKET_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_SOCKET_TOKEN_SECRET
    }
  );

  user.blocked_until_pin = null;
  user.wrong_pin_attempts = 0;
  await user.save()

  res.status(StatusCodes.OK).json({
    sucess : true,
    socket_token : {
        socket_access_token : access_token,
        socket_refresh_token : refresh_token,
    }
  })
 }

 async  function verifySignature(signature, payload, publicKey) {
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    const key = new NodeRSA();
    const signedData = key.importKey(publicKeyBuffer, "public-der");
    const signatureVerified = signedData.verify(
        Buffer.from(payload),
        signature,
        "utf8",
        "base64"
    );
    return signatureVerified

 }

 export {uploadBiometric, verifyBiometric}