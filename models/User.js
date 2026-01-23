import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import {BadRequestError, NotFoundError, UnautheticatedError} from "../errors/index.js"


const UserSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        match : [
            "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            "Please add a valid email"],
    },
    password : {
     type : String,
     
    },
    name : {
        type : String,
        maxlength : 50,
        minlength  : 3,
    },
    login_pin : {
        type : String,
        maxlength : 4,
        minlength : 4,
    },
    phone_number : {
        type : String,
        match : [
            /^[0-9]{10}$/,
            "Please provide a 10-digit number without spaces or special character",
        ],
        unique : true,
        spares : true
    },

    date_of_birth : Date,
    biometricKey : String,
    gender : {
        type : String,
        enum : ['male', 'female', 'other']
    },
    wrong_pin_attempts : {
        type : Number,
        default : 0,
    },
    blocked_until_pin : {
        type : Date, 
        default : null,
    },
     wrong_password_attempts : {
        type : Number,
        default : 0,
     },
     blocked_until_password : {
        type : Date,
        default : null,
     },
 
     balance : {
        type : Number,
        default : 50000.0,
     },
}, {timestamps : true});




const User = mongoose.model("User", UserSchema)
export default User


