import { db } from "../../config/db.js";
import { users } from "../models/userModel.js";
import { eq } from "drizzle-orm";
import status from "http-status";

export const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res
        .status(status.LENGTH_REQUIRED)
        .json({
          status: status.LENGTH_REQUIRED,
          error: "Username is required",
        });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    res.json({ available: existingUser.length === 0 });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const searchUser = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res
        .status(status.BAD_REQUEST)
        .json({ error: "Username parameter is required" });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (user.length > 0) {
      const { password, ...sanitizedUser } = user[0];
      return res.status(status.OK).json({
        status: status.OK,
        message: "User found",
        data: sanitizedUser,
      });
    }

    return res.status(status.NOT_FOUND).json({ error: "No user found" });
  } catch (error) {
    console.error("Error in searchUser:", error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occurred while searching for the user" });
  }
};

export const getAllUsers = async (req, res) => {
  try{
    const usersList = await db
      .select()
      .from(users);

    if (usersList.length > 0) {
      const sanitizedUsers = usersList.map(({ password, ...user }) => user);
      return res.status(status.OK).json({
        status: status.OK,
        message: "Users found",
        data: sanitizedUsers,
      });
    }

    return res.status(status.NOT_FOUND).json({ error: "No users found" });
  }catch (error) {
    console.error("Error in getAllUsers:", error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occurred while fetching users" });
  }
}

export const getUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res
        .status(status.BAD_REQUEST)
        .json({ error: "id parameter is required" });
    }

    const user = await db.select().from(users).where(eq(users.id, id));

    if (user.length > 0) {
      const { password, ...sanitizedUser } = user[0];
      return res.status(status.OK).json({
        status: status.OK,
        message: "User found",
        data: sanitizedUser,
      });
    }

    return res.status(status.NOT_FOUND).json({ error: "No user found" });
  } catch (error) {
    console.error("Error in searchUser:", error);
    return res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occurred while searching for the user" });
  }
};
