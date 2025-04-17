import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";
import { users } from "../models/userModel.js";
import { eq } from "drizzle-orm";
import status from "http-status";

dotenv.config();

export const registerUser = async (req, res, next) => {
  try {
    const userInfo = req.body;
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET is not defined in the environment variables."
      );
    }

    //prepare the data to be inserted into the database:
    //1. encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userInfo.password, salt);

    userInfo.password = hashedPassword;

    //2. insert into the db with returning
    let response;
    try {
      response = await db.insert(users).values(userInfo).returning({
        id: users.id,
        name: users.name,
        username: users.username,
        gender: users.gender,
        lastSeen: users.lastSeen,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
      });
    } catch (dbError) {
      if (dbError.code === "23505") { // Assuming PostgreSQL unique violation error code
        return res.status(status.CONFLICT).json({
          status: status.CONFLICT,
          error: "User already exists",
        });
      }
      throw dbError; // Re-throw other errors to be handled by the outer catch block
    }

    //3. Generate JWT token and send to the client
    const payload = { id: response[0].id, username: response[0].username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "2h",
    });

    //4. Send response
    res.status(status.CREATED).json({
      status: status.CREATED,
      messages: "New user created successfully",
      data: { ...response[0] },
      token: token,
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "An internal server error occurred." });
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))

    if (user.length === 0) {
      return res.status(status.UNAUTHORIZED).json({
      status: status.UNAUTHORIZED,
      error: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(status.UNAUTHORIZED).json({
        status: status.UNAUTHORIZED,
        error: "Invalid password",
        });
    }

    const payload = { id: user[0].id, username: user[0].username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "2h",
    });

    //sanitizing the user :D                          
    const sanitizedUser = (({ password, ...rest }) => rest)(user[0]);
    //Note to myself: the above line of code is called IIFE (Immediately Invoked Function) here it is written in the form of an arrow function. 
    //it takes an object as the input and then takes out password field from it and destructures rest of object into a new object and returns it. 

    return res.status(status.OK).json({
      status: status.OK,
      messages: "User details",
      data: sanitizedUser,
      token: token,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "An internal server error occurred." });
    next(error);
  }
};
