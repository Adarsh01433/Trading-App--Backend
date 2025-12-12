import express from "express";
import {login, logout, refreshToken, register} from "../controller/auth/auth.js"
const router = express.Router();
import authenticateUser from "../middleware/authentication.js"

router.post("/refresh-token", refreshToken);
router.post("/logout", authenticateUser, logout);
router.post("/register", register);
router.post("/login", login);


export default router;