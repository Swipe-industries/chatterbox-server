import { db } from "../config/db.js";
import { users } from "../models/userModel.js";
import { eq, ilike, sql } from "drizzle-orm";
import status from "http-status";
import { getErrorResponse, getSuccessResponse } from "../utils/response.js";
import { passwordValidator } from "../utils/validation.js";
import bcrypt from "bcryptjs";
import validator from "validator";

const USER_SAFE_DATA = {
  id: users.id,
  name: users.name,
  username: users.username,
  gender: users.gender,
  lastSeen: users.lastSeen,
  updatedAt: users.updatedAt,
  createdAt: users.createdAt,
  deletedAt: users.deletedAt,
};

export const resetPassword = async (req, res) => {
  try {
    //validate the password:
    passwordValidator(req);

    const { password, username } = req.body;

    //encrypt the password:
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //update into db:
    const response = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));

    if (response.rowCount === 0) {
      throw new Error("Failed to reset password!");
    }

    return res
      .status(status.OK)
      .json(getSuccessResponse(status.OK, "Password updated successfully"));
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const getLastSeen = async (req, res) => {
  try {
    const { userId } = req.params;
    //validate userId:
    if (!validator.isUUID(userId)) {
      throw new Error("Invalid userId");
    }

    const [response] = await db
      .select({ lastSeen: users.lastSeen })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!response) {
      throw new Error("User with given userId does not exist!");
    }

    return res
      .status(status.OK)
      .json(getSuccessResponse(status.OK, "lastSeen of the user", response));
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!validator.isLength(username, { min: 3, max: 30 })) {
      throw new Error("Invalid username");
    }

    const response = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const available = response.length === 0 ? true : false;

    res
      .status(status.OK)
      .json(
        getSuccessResponse(
          status.OK,
          available
            ? `${username} is available`
            : `${username} is not available`,
          { available }
        )
      );
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const searchUser = async (req, res) => {
  const loggedInUserId = req.user.userId;
  const ALLOWED_PARAMS = ["username"];
  try {
    const queryParams = req.query;

    //validating the query params:
    const isQueryValid = Object.keys(queryParams).every((key) =>
      ALLOWED_PARAMS.includes(key)
    );

    if (!isQueryValid) {
      throw new Error("Invalid Query!");
    }

    if (!queryParams.username) {
      throw new Error("username is missing in query");
    }

    const searchTerm = queryParams.username.trim();
    if (!searchTerm) {
      throw new Error("username cannot be empty");
    }

    const response = await db
      .select(USER_SAFE_DATA)
      .from(users)
      .where(ilike(users.username, `%${searchTerm}%`));

    if (response.length === 0) {
      return res
        .status(status.NOT_FOUND)
        .json(getErrorResponse(status.NOT_FOUND, "No user found"));
    }

    // removing self:
    const usersData = response.filter((user) => user.id !== loggedInUserId);
    return res
      .status(status.OK)
      .json(
        getSuccessResponse(
          status.OK,
          `${searchTerm} found!`,
          usersData
        )
      );
  } catch (err) {
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json(getErrorResponse(status.INTERNAL_SERVER_ERROR, err.message));
  }
};
