import express from "express";
import {login, logout, refreshToken, register} from "../controller/auth/auth.js"
import authenticateUser from "../middleware/authentication.js"
import { checkEmail } from "../controller/auth/email.js"
import { signInwithOauth } from "../controller/auth/oauth.js"
import { sendOtp, verifyOtp } from "../controller/auth/otp.js"
import { getProfile, setLoginPinFirst, updateProfile, verifyPin } from "../controller/auth/user.js";
import { uploadBiometric, verifyBiometric } from "../controller/auth/biometrics.js"


const router = express.Router();

router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logout);
router.post("/register", register);
router.post("/login", login);
router.post("/check-email", checkEmail);
router.post("oauth", signInwithOauth);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp",sendOtp);

router.route("/profile")
.get(authenticateUser, getProfile)
.get(authenticateUser, updateProfile);


router.post("/set-pin", authenticateUser, setLoginPinFirst);
router.post("/verify-pin", authenticateUser, verifyPin);
router.post("/upload-biometric", authenticateUser,uploadBiometric )
router.post("/verify-biometric", authenticateUser, verifyBiometric);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logout);



export default router;