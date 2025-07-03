import { dbClient } from "../../db/client";
import { eq } from "drizzle-orm";
import { Parameter, Strip, StripParameter } from "../../db/schema";

export async function evaluateStripQuality(s_id: string): Promise<void> {
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

  for (const param of stripParams) {
    const { sp_value, p_min, p_max } = param;

    const inRange = sp_value >= p_min && sp_value <= p_max;

    allInRange = allInRange && inRange;
    allOutOfRange = allOutOfRange && !inRange;
  }

  let color = "";
  let summaryMessage = "";

  if (allInRange) {
    color = "#00c951";
    summaryMessage = "Good";
  } else if (allOutOfRange) {
    color = "#fb2c36";
    summaryMessage = "Bad";
  } else {
    color = "#f0b100";
    summaryMessage = "Fair";
  }

  await dbClient
    .update(Strip)
    .set({
      s_quality: summaryMessage,
      s_qualitycolor: color,
    })
    .where(eq(Strip.s_id, s_id));
}
