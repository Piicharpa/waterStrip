import express from "express";
import { dbClient } from "../../db/client";
import { evaluateStripQuality } from "../../src/component/quality"; // Adjusted the path
import { Strip, Brand, Parameter, StripParameter, Color } from "../../db/schema";
import { eq , and} from "drizzle-orm";

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

router.get("/card/:id", async (req, res, next) => {
  const { id } = req.params; // รับค่า u_id จาก URL

  try {
    // ดึงข้อมูลจากตาราง Strip โดยกรองด้วย u_id
    const results = await dbClient.select().from(Strip).where(eq(Strip.u_id, id));

    if (results.length === 0) {
      res.status(404).json({ message: "No cards found for this user." });
    }

    // ส่งผลลัพธ์กลับเป็น JSON
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
      .values({ b_id, s_latitude, s_longitude , u_id , s_url ,s_quality: " ", s_qualitycolor: "#ffffff"}) // Default value for s_quality
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
    const s_id = parseInt(req.params.id);

    // Ensure evaluateStripQuality is defined or imported
    await evaluateStripQuality(s_id); // Replace this with the actual implementation or import

    res.json({ msg: "Quality evaluated and updated successfully" });
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
        b_id: Strip.b_id,
        b_name: Brand.b_name,
        s_latitude: Strip.s_latitude,
        s_longitude: Strip.s_longitude,
        p_id: Parameter.p_id,
        p_name: Parameter.p_name,
        p_unit: Parameter.p_unit,
        sp_value: StripParameter.sp_value,
        colors: Color.colors,
        values: Color.values
      })
      .from(Strip)
      .innerJoin(Brand, eq(Strip.b_id, Brand.b_id)) 
      .leftJoin(StripParameter, eq(Strip.s_id, StripParameter.s_id)) // เชื่อม Strip กับค่าพารามิเตอร์
      .leftJoin(Parameter, eq(StripParameter.p_id, Parameter.p_id)) // ดึงข้อมูล Parameter
      .leftJoin(Color, and(eq(Color.b_id, Strip.b_id), eq(Color.p_id, Parameter.p_id))) // ดึงข้อมูลสีที่เกี่ยวข้อง
      .where(eq(Strip.s_id, s_id));

    if (result.length === 0) {
      res.status(404).json({ message: "Strip not found" });
    }

    // ✅ จัดกลุ่มข้อมูลให้เป็น JSON ตามโครงสร้างที่ต้องการ
    const formattedData = {
      s_id: result[0].s_id,
      s_url: result[0].s_url,
      s_date: result[0].s_date,
      s_quality: result[0].s_quality,
      s_qualitycolor: result[0].s_qualitycolor,
      b_id: result[0].b_id,
      b_name: result[0].b_name,
      s_latitude: result[0].s_latitude,
      s_longitude: result[0].s_longitude,
      parameters: result.map(row => ({
        p_id: row.p_id,
        p_name: row.p_name,
        p_unit: row.p_unit,
        sp_value: row.sp_value,
        colors: row.colors || null ,// ถ้าไม่มีสีให้ส่งค่า null
        values: row.values || null
      })).filter(param => param.p_id !== null) // ลบค่าที่ไม่มี parameter ออก
    };

    res.json(formattedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



export default router;
