import express from "express";
import { dbClient } from "../../db/client";
import { Brand } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

// GET all brands
router.get("/", async (req, res) => {
  const brands = await dbClient.select().from(Brand);
  res.json(brands);
});

// POST new brand
router.post("/", async (req, res, next) => {
  try {
    const { b_name, b_chart } = req.body;
    if (!b_name) throw new Error("Brand name is required");

    const result = await dbClient.insert(Brand).values({ b_name, b_chart }).returning();
    res.status(201).json({ msg: "Brand created successfully", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// PATCH update brand
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { b_name, b_chart } = req.body;

  const [updatedBrand] = await dbClient.update(Brand).set({ b_name, b_chart }).where(eq(Brand.b_id, Number(id))).returning();

  if (!updatedBrand) res.status(404).json({ error: "Brand not found" });

  res.json(updatedBrand);
});

export default router;
