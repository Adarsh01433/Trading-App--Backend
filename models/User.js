import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  BadRequestError,
  NotFoundError,
  UnautheticatedError,
} from "../errors/index.js";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      maxlength: 50,
      minlength: 3,
    },
    login_pin: {
      type: String,
    },
    phone_number: {
      type: String,
      match: [
        /^[0-9]{10}$/,
        "Please provide a 10-digit number without spaces or special character",
      ],
      unique: true,
      spares: true,
    },

    date_of_birth: Date,
    biometricKey: String,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    wrong_pin_attempts: {
      type: Number,
      default: 0,
    },
    blocked_until_pin: {
      type: Date,
      default: null,
    },
    wrong_password_attempts: {
      type: Number,
      default: 0,
    },
    blocked_until_password: {
      type: Date,
      default: null,
    },

    balance: {
      type: Number,
      default: 50000.0,
    },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  // “Kya password field change hui hai?”
  //New user → YES ,Password update → YES , Sirf email update → NO

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

UserSchema.pre("save", async function () {
  if (this.isModified) {
    const salt = await bcrypt.genSalt(10);
    this.login_pin = await bcrypt.hash(this.login_pin, salt);
  }
});

// reset pin

UserSchema.static.updatePIN = async function (email, newPIN) {
  try {
    const user = await this.findOne({ email });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isSamePIN = await bcrypt.compare(newPIN, user.login_pin);
    if (isSamePIN) {
      throw new BadRequestError("New PIN must be different from old PIN");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPIN = await bcrypt.hash(newPIN, salt);

    await this.findOneAndUpdate(
      { email },
      { login_pin: hashedPIN, wrong_pin_attempts: 0, blocked_until_pin: null },
    );

    return { sucess: true, message: "PIN updated Sucessfully" };
  } catch (error) {
    throw error;
  }
};

// reset password

UserSchema.static.updatePassword = async function (email, newPassword) {
  try {
    const user = await this.findOne({ email }); // find user
    if (!user) {
      throw new NotFoundError("user not found");
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestError(
        "New Password Must be different from old Password",
      );
    }

    const salt = await bcrypt.genSalt(10); // gen salt
    const hashedPassword = await bcrypt.hash(newPassword, salt); // hasing

    // updating
    await this.findOneAndUpdate(
      { email },
      {
        password: hashedPassword,
        wrong_password_attempts: 0,
        blocked_until_password: null,
      },
    );
    return { sucess: true, message: "Password Updated sucessfully" };
  } catch (error) {
    throw error;
  }
};

// compare Password
UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  
  if (this.blocked_until_password && this.blocked_until_password > new Date()) {
    throw new UnautheticatedError(
      "Invalid Login attempts exceeded, Please try after 30 minutes",
    );
  }

  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  if (!isMatch) {
    this.wrong_password_attempts += 1;
    if (wrong_password_attempts >= 3) {
      this.blocked_until_password = new Date(Date.now() + 30 * 60 * 60 * 1000);
      this.wrong_password_attempts = 0;
    }
    await this.save();
  } else {
    this.wrong_password_attempts = 0;
    this.blocked_until_password = null;
    await this.save();
  }
  return isMatch;
};

UserSchema.methods.comparePIN = async function comparePIN(candidatePIN) {
  if (this.blocked_until_pin && this.blocked_until_pin > new Date()) {
    throw new UnautheticatedError(
      "Invalid Login attempts exceed , Please try after 30 min",
    );
  }

  const isMatch = await bcrypt.compare(candidatePIN, this.login_pin);
  if (!isMatch) {
    this.wrong_pin_attempts += 1;
    if (wrong_pin_attempts >= 3) {
      this.blocked_until_password = new Date(Date.now() + 30 * 60 * 60 * 1000);
      this.wrong_pin_attempts = 0;
    }
    await this.save();
  } else {
    this.wrong_pin_attempts = 0;
    this.blocked_until_pin = null;
    await this.save();
  }
  return isMatch;
};

UserSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { userId: this._id, name: this.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

UserSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { userId: this._id, name: this.name },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_SECRET },
  );
};

const User = mongoose.model("User", UserSchema);
export default User;
