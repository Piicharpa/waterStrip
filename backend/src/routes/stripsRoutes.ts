import express from "express";
import { dbClient } from "../../db/client";
import { Strip } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Get All from Strip
router.get("/", async (req, res, next) => {
  try {
    const results = await dbClient.query.Strip.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Insert into Strip
router.post("/", async (req, res, next) => {
  console.log("Request Body:", req.body);
  try {
    const { b_id, s_latitude, s_longitude, u_id , s_url} = req.body;

    // Corrected check for missing fields
    if (!b_id || !s_latitude || !s_longitude || !u_id || !s_url) {
      throw new Error("Missing required fields: b_id, s_latitude, s_longitude, u_id, s_url");
    }

    // Insert new strip
    const result = await dbClient
      .insert(Strip)
      .values({ b_id, s_latitude, s_longitude , u_id , s_url ,s_quality: 250}) // Default value for s_quality
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// Update strip in Strip
router.patch("/:id", async (req, res, next) => {
  try {
    console.log("Received Request Body:", req.body); // Debugging log

    const s_id = parseInt(req.params.id);
    const { s_quality } = req.body;

    // Check if s_quality is provided
    if (!s_quality) {
       res.status(400).json({ error: "s_quality is required" });
    }

    // Perform the update
    const result = await dbClient
      .update(Strip)
      .set({ s_quality }) // Update only s_quality
      .where(eq(Strip.s_id, s_id))
      .returning();

    res.json({ msg: "Quality updated successfully", data: result });
  } catch (err) {
    next(err);
  }
});


// Delete strip from Strip
router.delete("/:id", async (req, res, next) => {
  try {
    const s_id = parseInt(req.params.id);
    if (!s_id) throw new Error("Missing strip id");

    const results = await dbClient.query.Strip.findMany({
      where: eq(Strip.s_id, s_id),
    });
    if (results.length === 0) throw new Error("Strip not found");

    await dbClient.delete(Strip).where(eq(Strip.s_id, s_id));
    res.json({ msg: "Strip deleted successfully", data: { s_id } });
  } catch (err) {
    next(err);
  }
});

export default router;
