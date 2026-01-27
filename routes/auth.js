import express from "express";
import {login, logout, refreshToken, register} from "../controller/auth/auth.js"
import authenticateUser from "../middleware/authentication.js"
import { checkEmail } from "../controller/auth/email.js"
import { signInwithOauth } from "../controller/auth/oauth.js"
import { verifyOtp } from "../controller/auth/otp.js"

const router = express.Router();

router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logout);
router.post("/register", register);
router.post("/login", login);
router.post("/check-email", checkEmail);
router.post("oauth", signInwithOauth);
router.post("/verify-otp", verifyOtp)



export default router;