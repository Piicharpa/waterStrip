import express from "express";
import { dbClient } from "../../db/client";
import { Color } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// GET all colors
router.get("/", async (req, res, next) => {
  try {
    const results = await dbClient.query.Color.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// POST new color
router.post("/", async (req, res, next) => {
  try {
    const { b_id, p_id, colors, values } = req.body;

    // Check for missing fields
    if (!b_id || !p_id || !colors || !values) {
      throw new Error("Missing required fields");
    }

    // Insert new strip
    const result = await dbClient
      .insert(Color)
      .values({ b_id, p_id, colors, values })
      .returning()

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// PATCH update color
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedColor] = await dbClient.update(Color)
      .set(updateData)
      .where(eq(Color.c_id, Number(id)))
      .returning();
    
    if (!updatedColor) {
      res.status(404).json({ error: "Color not found" });
    }
    res.json({ message: "Color updated", data: updatedColor });
  } catch (error) {
    res.status(500).json({ error: "Failed to update color" });
  }
});

router.get("/:b_id", async (req, res) => {
  const { b_id } = req.params;

  try {
    const result = await dbClient
      .select({ colors: Color.colors, values: Color.values })
      .from(Color)
      .where(eq(Color.b_id,Number(b_id)));

    // แปลงผลลัพธ์ให้อยู่ในรูปแบบ array
    const formattedResult = result.map(row => ({
      colors: row.colors,
      values: row.values
    }));

    res.json(formattedResult);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

export default router;
