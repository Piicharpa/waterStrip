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

// ดึงข้อมูลผู้ใช้จากฐานข้อมูล
router.get("/:u_id", async (req, res) => {
  try {
    const { u_id } = req.params;

    // ดึงข้อมูลจากตาราง users โดยใช้ drizzle หรือ query ปกติ
    const user = await dbClient.query.User.findFirst({
      where: (users, { eq }) => eq(users.u_id, u_id),
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    res.json(user); // ส่งข้อมูลผู้ใช้กลับไปให้ Frontend
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

// API เช็คว่ามี user อยู่หรือยัง
router.post("/check-user", async (req, res) => {
  const { u_id } = req.body;

  try {
    const user = await dbClient.select().from(User).where(eq(User.u_id,u_id)).limit(1);

    if (user.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Database error", error });
  }
});

export default router;
