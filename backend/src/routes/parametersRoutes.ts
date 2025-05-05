import express from "express";
import { dbClient } from "../../db/client";
import { Parameter } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// GET all parameters
router.get("/", async (req, res) => {
  const parameters = await dbClient.select().from(Parameter);
  res.json(parameters);
});

// POST new parameter
/* 
 { 
  "p_name": "pH", 
  "p_unit": "pH", 
  "p_min": 0, 
  "p_max": 14 
  } 
*/
router.post("/", async (req, res) => {
  const { p_name, p_unit, p_min, p_max } = req.body;
  if (!p_name) res.status(400).json({ error: "p_name is required" });

  const [newParameter] = await dbClient
    .insert(Parameter)
    .values({ p_name, p_unit, p_min, p_max })
    .returning();
  res.status(201).json(newParameter);
});

// PATCH update parameter
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { p_name, p_unit, p_min, p_max } = req.body;

  const [updatedParameter] = await dbClient
    .update(Parameter)
    .set({ p_name, p_unit, p_min, p_max })
    .where(eq(Parameter.p_id, Number(id)))
    .returning();

  if (!updatedParameter) res.status(404).json({ error: "Parameter not found" });
  res.json(updatedParameter);
});

export default router;
