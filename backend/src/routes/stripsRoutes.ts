import express from "express";
import { dbClient } from "../../db/client";

import { evaluateStripQuality } from "../../src/component/quality"; // Adjusted the path
import {
  Strip,
  Brand,
  Parameter,
  StripParameter,
  Color,
  StripStatus,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";


const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const results = await dbClient.query.Strip.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get("/card/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const results = await dbClient
      .select()
      .from(Strip)
      .where(eq(Strip.u_id, id));

    if (results.length === 0) {
      res.status(404).json({ message: "No cards found for this user." });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  console.log("Request Body:", req.body);
  try {
    const { b_id, s_latitude, s_longitude, u_id, s_url } = req.body;

    if (!b_id || !s_latitude || !s_longitude || !u_id || !s_url) {
      throw new Error(
        "Missing required fields: b_id, s_latitude, s_longitude, u_id, s_url"
      );
    }

    const result = await dbClient
      .insert(Strip)
      .values({
        b_id,
        s_latitude,
        s_longitude,
        u_id,
        s_url,
        s_quality: 250,
        s_qualitycolor: "#ffffff",
      })
      .returning();

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0],
    });
  } catch (err) {
    next(err);
  }
});

// Update strip in Strip
router.patch("/quality/:id", async (req, res, next) => {
  try {
    const s_id = parseInt(req.params.id);

    // Ensure evaluateStripQuality is defined or imported
    await evaluateStripQuality(s_id); // Replace this with the actual implementation or import

    res.json({ msg: "Quality evaluated and updated successfully" });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    // console.log("Received Request Body:", req.body);
    const s_id = parseInt(req.params.id);
    const { s_quality, s_qualitycolor } = req.body;

    if (!s_quality) {
      res.status(400).json({ error: "s_quality is required" });
    }

    const result = await dbClient
      .update(Strip)
      .set({ s_quality, s_qualitycolor })
      .where(eq(Strip.s_id, s_id))
      .returning();
    
    res.json({ msg: "Strip updated successfully", data: result });
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

router.get("/:id", async (req, res) => {
  try {
    const s_id = Number(req.params.id);

    const result = await dbClient
      .select({
        s_id: Strip.s_id,
        s_url: Strip.s_url,
        s_date: Strip.s_date,
        s_quality: Strip.s_quality,
        s_qualitycolor: Strip.s_qualitycolor,
        s_status: Strip.s_status,
        b_id: Strip.b_id,
        b_name: Brand.b_name,
        s_latitude: Strip.s_latitude,
        s_longitude: Strip.s_longitude,
        p_id: Parameter.p_id,
        p_name: Parameter.p_name,
        p_unit: Parameter.p_unit,
        sp_value: StripParameter.sp_value,
        colors: Color.colors,
        values: Color.values,
      })
      .from(Strip)
      .innerJoin(Brand, eq(Strip.b_id, Brand.b_id))
      .leftJoin(StripParameter, eq(Strip.s_id, StripParameter.s_id))
      .leftJoin(Parameter, eq(StripParameter.p_id, Parameter.p_id))
      .leftJoin(
        Color,
        and(eq(Color.b_id, Strip.b_id), eq(Color.p_id, Parameter.p_id))
      )
      .where(eq(Strip.s_id, s_id));

    if (result.length === 0) {
      res.status(404).json({ message: "Strip not found" });
    }

    const formattedData = {
      s_id: result[0].s_id,
      s_url: result[0].s_url,
      s_date: result[0].s_date,
      s_quality: result[0].s_quality,
      s_qualitycolor: result[0].s_qualitycolor,
      s_status: result[0].s_status,
      b_id: result[0].b_id,
      b_name: result[0].b_name,
      s_latitude: result[0].s_latitude,
      s_longitude: result[0].s_longitude,
      parameters: result
        .map((row) => ({
          p_id: row.p_id,
          p_name: row.p_name,
          p_unit: row.p_unit,
          sp_value: row.sp_value,
          colors: row.colors || null,
          values: row.values || null,
        }))
        .filter((param) => param.p_id !== null),
    };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/strip-status", async (req, res) => {
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

export default router;
