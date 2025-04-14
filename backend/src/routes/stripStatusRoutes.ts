import express from "express";
import { dbClient } from "../../db/client";
import { Brand, Strip, StripStatus } from "../../db/schema";
import { eq } from "drizzle-orm";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { u_id, s_id, status } = req.body;

    if (!s_id || !status || !u_id) {
      res.status(400).json({ error: "Missing s_id or status" });
    }

    const inserted = await dbClient
      .insert(StripStatus)
      .values({
        s_id,
        status,
        u_id,
      })
      .returning();

    res.status(201).json({ message: "Inserted successfully", data: inserted });
  } catch (error) {
    console.error("Error inserting strip status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const statuses = await dbClient.select().from(StripStatus);
    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching strip status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const strips = await dbClient
      .select({
        s_id: Strip.s_id,
        s_date: Strip.s_date,
        s_quality: Strip.s_quality,
        s_qualitycolor: Strip.s_qualitycolor,
        s_latitude: Strip.s_latitude,
        s_longitude: Strip.s_longitude,
        brand_name: Brand.b_name,
      })
      .from(StripStatus)
      .innerJoin(Strip, eq(Strip.s_id, StripStatus.s_id))
      .innerJoin(Brand, eq(Strip.b_id, Brand.b_id))
      .where(eq(StripStatus.status, "public"));

    res.json(strips);
  } catch (err) {
    console.error("Error fetching public strips:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
