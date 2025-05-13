// Route: localhost:3003/strips_parameter
import express from "express";
import { dbClient } from "../../db/client";
import { StripParameter } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import axios from "axios";

const router = express.Router();

// Get All from Strip paramenter
router.get("/", async (req, res, next) => {
  try {
    const results = await dbClient.query.StripParameter.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Insert into Strip parameter
/* {
  "s_id": 1,
  "p_id": 1,
  "sp_value": 10
} */
router.post("/", async (req, res, next) => {
  try {
    const { s_id, p_id, sp_value } = req.body;

    // Check for missing fields
    if (!s_id || !p_id || !sp_value === undefined) {
      throw new Error("Missing required fields: s_id, p_id, sp_value ");
    }

    // Insert new strip
    const result = await dbClient
      .insert(StripParameter)
      .values({ s_id, p_id, sp_value })
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

router.post("/pH", async (req, res, next) => {
  try {
    const s_id = req.body;

    // Check for missing fields
    if (!s_id) {
      throw new Error("Missing required fields: s_id");
    }

    // Call the prediction API
    const response = await axios.get(
      `http://localhost:3003/strips/predict/${s_id}`
    );
    if (response.status !== 200) {
      throw new Error("Error fetching prediction from the API");
    }
    const prediction = (response.data as { prediction: number }).prediction;

    // Insert new strip
    const result = await dbClient
      .insert(StripParameter)
      .values({ s_id, p_id: 1, sp_value: prediction })
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:s_id/:p_id", async (req, res, next) => {
  const { s_id, p_id } = req.params;
  const { sp_value } = req.body;

  try {
    const [updatedStripParameter] = await dbClient
      .update(StripParameter)
      .set({ sp_value })
      .where(
        and(
          eq(StripParameter.s_id, s_id),
          eq(StripParameter.p_id, Number(p_id))
        )
      )
      .returning();

    if (!updatedStripParameter) {
      res.status(404).json({ error: "Strip parameter not found" });
    } else {
      res.json(updatedStripParameter);
    }
  } catch (err) {
    next(err);
  }
});

// DELETE All from Strip parameter
router.delete("/delete-all", async (req, res, next) => {
  try {
    // Delete all records from StripParameter table
    await dbClient.delete(StripParameter);
    res.status(200).json({ msg: "All records deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
