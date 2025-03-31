import express from "express";
import { dbClient } from "../../db/client";
import { User } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Get All Users
router.get("/", async (req, res, next) => {
  try {
    const results = await dbClient.query.User.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Create User
router.post("/", async (req, res, next) => {
  try {
    const { u_id, u_name, u_email, u_role } = req.body;
    if ( !u_email || !u_role || !u_id ) {
      throw new Error("Missing required fields: u_name, u_email, u_password");
    }

    const result = await dbClient.insert(User).values({ u_id,u_name, u_email, u_role }).returning();
    res.status(201).json({ msg: "User created successfully", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// Update User
router.patch("/:id", async (req, res, next) => {
  try {
    const u_id = req.params.id;
    const { u_name } = req.body;
    if (!u_name ) throw new Error("No data to update");

    const result = await dbClient.update(User).set({ u_name }).where(eq(User.u_id, u_id)).returning();
    res.json({ msg: "User updated successfully", data: result });
  } catch (err) {
    next(err);
  }
});

// Delete User
router.delete("/:id", async (req, res, next) => {
  try {
    const u_id = req.params.id;
    if (!u_id) throw new Error("Missing user id");

    const results = await dbClient.query.User.findMany({ where: eq(User.u_id, u_id) });
    if (results.length === 0) throw new Error("User not found");

    await dbClient.delete(User).where(eq(User.u_id, u_id));
    res.json({ msg: "User deleted successfully", data: { u_id } });
  } catch (err) {
    next(err);
  }
});

export default router;
