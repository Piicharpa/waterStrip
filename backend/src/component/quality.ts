import { dbClient } from "../../db/client";
import { eq } from "drizzle-orm";
import { Parameter, Strip, StripParameter } from "../../db/schema";

export async function evaluateStripQuality(s_id: number): Promise<void> {
  const stripParams = await dbClient
    .select({
      sp_value: StripParameter.sp_value,
      p_id: StripParameter.p_id,
      p_name: Parameter.p_name,
      p_min: Parameter.p_min,
      p_max: Parameter.p_max,
    })
    .from(StripParameter)
    .innerJoin(Parameter, eq(StripParameter.p_id, Parameter.p_id))
    .where(eq(StripParameter.s_id, s_id));

  let allInRange = true;
  let allOutOfRange = true;
  let qualityMessages: string[] = [];

  for (const param of stripParams) {
    const { p_name, sp_value, p_min, p_max } = param;

    let message = "";
    let inRange = false;

    if (sp_value < p_min) {
      message = `พารามิเตอร์ "${p_name}" ต่ำกว่าช่วงที่กำหนด`;
    } else if (sp_value > p_max) {
      message = `พารามิเตอร์ "${p_name}" สูงกว่าช่วงที่กำหนด`;
    } else {
      message = `พารามิเตอร์ "${p_name}" อยู่ในช่วงที่กำหนด`;
      inRange = true;
    }

    qualityMessages.push(message);
    allInRange = allInRange && inRange;
    allOutOfRange = allOutOfRange && !inRange;
  }

  let color = "";
  if (allInRange) {
    color = "#00FF00";
  } else if (allOutOfRange) {
    color = "#FF0000";
  } else {
    color = "#FFFF00";
  }

  // ✅ อัปเดตค่าในตาราง Strip
  await dbClient
    .update(Strip)
    .set({
      s_quality: qualityMessages.join(" , "),
      s_qualitycolor: color,
    })
    .where(eq(Strip.s_id, s_id));
}
