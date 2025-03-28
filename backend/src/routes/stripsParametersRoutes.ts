import express from "express";
import { dbClient } from "../../db/client";
import { StripParameter } from "../../db/schema";

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
router.post("/", async (req, res, next) => {
  try {
    const { s_id, p_id, sp_value } = req.body;

    // Check for missing fields
    if (!s_id || !p_id || !sp_value  === undefined) {
      throw new Error("Missing required fields: s_id, p_id, sp_value ");
    }

    // Insert new strip
    const result = await dbClient
      .insert(StripParameter)
      .values({ s_id, p_id, sp_value  })
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// Update strip parameter
// router.patch("/strips_parameter/:id", async (req, res) => {
//   const { id } = req.params;
//   const { sp_value } = req.body;

//   const [updatedBrand] = await dbClient.update(StripParameter).set({ sp_value }).where(eq(StripParameter.sp_id, Number(id))).returning();

//   if (!updatedBrand) res.status(404).json({ error: "not found" });

//   res.json(updatedBrand);
// });

export default router;