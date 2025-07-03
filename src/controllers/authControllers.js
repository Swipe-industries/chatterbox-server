import bcrypt from "bcryptjs";
import { db } from "../config/db.js";
import { users } from "../models/userModel.js";
import { eq } from "drizzle-orm";
import status from "http-status";
import { loginValidator, signupValidator } from "../utils/validation.js";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import getJWT from "../utils/getJwt.js";

export const signup = async (req, res) => {
  try {
    //validate the req body
    signupValidator(req);

    const userData = req.body;

    //1. encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    userData.password = hashedPassword;

    //2. insert into the db with returning
    const user = await db.insert(users).values(userData).returning();
    const response = user.map(({ password, ...rest }) => rest);

    //3. Generate JWT token and send to the client
    const payload = { userId: response[0].id };
    const token = getJWT(payload);

    //4. Send response
    res
      .cookie("token", token, { expires: new Date(Date.now() + 2 * 3600000) })
      .status(status.CREATED)
      .json(
        getSuccessResponse(
          status.CREATED,
          `Signed up as ${response[0].name}`,
          response
        )
      );
  } catch (error) {
    console.error("Error in registerUser:", error);
    if (error.code == 23505) {
      error.message = "User already exists";
    }
    res
      .status(status.BAD_REQUEST)
      .json(getErrorResponse(status.BAD_REQUEST, error.message));
  }
};

export const loginUser = async (req, res) => {
  try {
    //validate the req body:
    loginValidator(req);

    //extract username and password
    const { username, password } = req.body;

    //fetch user from DB:
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (user.length === 0) {
      return res
        .status(status.UNAUTHORIZED)
        .json(
          getErrorResponse(
            status.UNAUTHORIZED,
            "Either username or password is incorrect"
          )
        );
    }

    //check if the password matches
    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res
        .status(status.UNAUTHORIZED)
        .json(
          getErrorResponse(
            status.UNAUTHORIZED,
            "Either username or password is incorrect"
          )
        );
    }

    //sanitizing the user :D
    const response = user.map(({ password, ...rest }) => rest);

    const payload = { userId: user[0].id };
    const token = getJWT(payload);

    return res
      .cookie("token", token, { expires: new Date(Date.now() + 2 * 3600000) })
      .status(status.OK)
      .json(
        getSuccessResponse(
          status.OK,
          `Logged-in as ${response[0].name}`,
          response
        )
      );
  } catch (error) {
    console.error("Error in loginUser:", error);
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, error.message));
  }
};

export const logout = async (req, res) => {
  res
    .cookie("token", null, { expires: new Date(Date.now()) })
    .status(status.OK)
    .json(getSuccessResponse(status.OK, "Successfully logged out"));
};
