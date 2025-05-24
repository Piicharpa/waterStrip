import express from "express";
import { dbClient } from "../../db/client";

import {
  Strip,
  Brand,
  StripStatus,
} from "../../db/schema";

import { eq, and } from "drizzle-orm";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { u_id, s_id, status } = req.body;

    if (!s_id || !status || !u_id) {
      res.status(400).json({ error: "Missing s_id, status, or u_id" });
    }

    // ตรวจสอบก่อนว่า status ของ strip นี้มีอยู่แล้วหรือยัง
    // ใช้ where หลายครั้ง
    const existingStatus = await dbClient
      .select()
      .from(StripStatus)
      .where(and(eq(StripStatus.u_id, u_id), eq(StripStatus.s_id, s_id)));

    // ถ้ามีอยู่แล้ว, ส่งข้อมูลสถานะที่มีอยู่
    if (existingStatus.length > 0) {
      res
        .status(200)
        .json({ message: "Status already exists", data: existingStatus });
    }

    // ถ้ายังไม่มี, ทำการเพิ่ม status ใหม่
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

router.patch("/", async (req, res) => {
  try {
    const { u_id, s_id, status } = req.body;

    if (!s_id || !status || !u_id) {
      res.status(400).json({ error: "Missing s_id, u_id, or status" });
    }

    const updated = await dbClient
      .update(StripStatus)
      .set({ status })
      .where(eq(StripStatus.s_id, s_id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Strip status not found" });
    }

    res.status(200).json({ message: "Updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating strip status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/public", async (req, res) => {
  const { brand, quality } = req.query;

  try {
    const conditions = [eq(StripStatus.status, "public")];

    if (brand) {
      conditions.push(eq(Brand.b_name, String(brand)));
    }

    if (quality) {
      conditions.push(eq(Strip.s_qualitycolor, String(quality)));
    }

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
      .where(and(...conditions)); // ใช้ where แค่ครั้งเดียว

    res.json(strips);
  } catch (err) {
    console.error("Error fetching public strips:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// เช็คสถานะของ strip สำหรับ u_id และ s_id
router.get("/:u_id/:s_id", async (req, res) => {
  try {
    const { u_id, s_id } = req.params;

    // ตรวจสอบว่า status ของ strip นี้มีอยู่หรือยัง
    const existingStatus = await dbClient
      .select()
      .from(StripStatus)
      .where(
        and(eq(StripStatus.u_id, u_id), eq(StripStatus.s_id, s_id))
      );

    // ถ้ามีสถานะอยู่แล้ว
    if (existingStatus.length > 0) {
      res
        .status(200)
        .json({ message: "Status found", status: existingStatus[0].status });
    } else {
      // ถ้าไม่พบสถานะ
      res.status(404).json({ message: "Status not found" });
    }
  } catch (error) {
    console.error("Error fetching strip status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
