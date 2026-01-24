import User from "../../models/User.js"
import { BadRequestError, UnautheticatedError } from "../../errors/index.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken"
import { JwksClient } from "jwks-rsa";
import { StatusCodes } from "http-status-codes";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JwksClientInstance = JwksClient({
    jwksUri : "http://appleid.apple.com/auth/keys",
    timeout : 30000, // 30 sec
});
 
async function getKey(kid){
    return new Promise((resolve, reject)=> {
        // 👉 Apple ke server se signing key maang rahe ho
        JwksClientInstance.getSigninKey(kid, (err, key)=> {
            if(err){
                return reject(err)
            }
            // 👉 Public key nikaali Ye key JWT verify karne me use hogi.
            const signingKey = key.getPublicKey();
            resolve(signingKey)
        })
    })
}

 const signInwithOauth = async(req, res)=> {
    const {id_token , provider} = req.body
    if(!id_token || ! provider || !["google", "apple"].includes(provider)){
        throw new BadRequestError("Invalid request")
    }

   try {
       let email, user;
    if(provider === "apple"){
        //   👉 Header se kid chahiye Isliye pehle decode

        const {header} = jwt.decode(id_token,{complete : true});
        // 2️⃣ Public key lao
        const kid = header.kid;
        const publicKey = await getKey(kid);
       //   3️⃣ Token verify
        ({email } = jwt.verify(id_token, publicKey));
    }

    if(provider === "google"){
        const ticket = await googleClient.verifyIdToken({
            idToken : id_token,
            audience : process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        email = payload.email
    }
  // 🔹 USER CREATE / UPDATE
    user = await User.findOneAndUpdate(
        {email}, // find user
        // update email_verified
        {email_verified : true},
        // upsert : true = create if not exists
        // new : true = updated document return
        {new: true, upsert : true}
    );

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();
    
  // flags bcz oauth can not complte profile
    let phone_exist = false;
    let login_pin_exist = false;

    if (user.phone) phone_exist = true;
     if(user.login_pin) login_pin_exist = true;
     res.status(StatusCodes.OK).json ({
        user : {
            email : user.email,
            name : user.name,
            userId : user.id,
            phone_exist,
            login_pin_exist
        },
        tokens : { access_token:accessToken, refresh_token:refreshToken}
     })
   
   } catch (error) {
    throw new UnautheticatedError("Invalid Oauth token")
   }

 }