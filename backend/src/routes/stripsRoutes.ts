import express from "express";
import { dbClient } from "../../db/client";
import { Strip } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// Get All from Strip
router.get("/strips", async (req, res, next) => {
  try {
    const results = await dbClient.query.Strip.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Insert into Strip
router.post("/strips", async (req, res, next) => {
  try {
    const { b_id, s_latitude, s_longitude, u_id , s_url} = req.body;

    // Check for missing fields
    if (!b_id || !s_latitude || !s_longitude || !u_id || !s_url) {
      throw new Error("Missing required fields: s_url, u_id, s_brand, s_location, s_ph");
    }

    // Insert new strip
    const result = await dbClient
      .insert(Strip)
      .values({ b_id, s_latitude, s_longitude , u_id , s_url})
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// // Update strip in Strip
// router.patch("/strips/:id", async (req, res, next) => {
//   try {
//     const s_id = parseInt(req.params.id);
//     const { b_id, s_date, s_latitude, s_longitude } = req.body;
//     if (!b_id && !s_date && !s_latitude && !s_longitude === undefined) throw new Error("No data to update");

//     const result = await dbClient
//       .update(Strip)
//       .set({ b_id, s_date, s_latitude, s_longitude })
//       .where(eq(Strip.s_id, s_id))
//       .returning();
    
//     res.json({ msg: "Strip updated successfully", data: result });
//   } catch (err) {
//     next(err);
//   }
// });

// Delete strip from Strip
router.delete("/strips/:id", async (req, res, next) => {
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
