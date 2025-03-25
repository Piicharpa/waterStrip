import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { dbClient } from "@db/client";
import { Brand, Parameter, Strip, StripParameter, User} from "@db/schema";
import { eq, and } from "drizzle-orm";

// Initialize the express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json()); // Parse incoming JSON requests

// =================== USERS API ===================

// Get All from User
app.get("/users", async (req, res, next) => {
  try {
    const results = await dbClient.query.User.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

app.post("/users", async (req, res, next) => {
  try {
    const { u_name, u_email, u_password, u_role, u_profile_pic } = req.body;

    // Check for missing fields
    if (!u_name || !u_email || !u_password || !u_role || !u_profile_pic) {
      throw new Error("Missing required fields: u_name, u_email, u_password");
    }

    // Insert new user
    const result = await dbClient
      .insert(User)
      .values({ u_name, u_email, u_password, u_role, u_profile_pic })
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "User created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// Update user in User by id
app.patch("/users/:id", async (req, res, next) => {
  try {
    const u_id = parseInt(req.params.id);
    const { u_name, u_email, u_password } = req.body;
    if (!u_name && !u_email && !u_password) throw new Error("No data to update");

    const result = await dbClient
      .update(User)
      .set({ u_name, u_email, u_password })
      .where(eq(User.u_id, u_id))
      .returning();
    
    res.json({ msg: "User updated successfully", data: result });
  } catch (err) {
    next(err);
  }
});

// Delete user in userTable by id
app.delete("/users/:id", async (req, res, next) => {
  try {
    const u_id = parseInt(req.params.id);
    if (!u_id) throw new Error("Missing user id");

    const results = await dbClient.query.User.findMany({
      where: eq(User.u_id, u_id),
    });
    if (results.length === 0) throw new Error("User not found");

    await dbClient.delete(User).where(eq(User.u_id, u_id));
    res.json({ msg: "User deleted successfully", data: { u_id } });
  } catch (err) {
    next(err);
  }
});


// =================== STRIPS API ===================

// Get All from Strip
app.get("/strips", async (req, res, next) => {
  try {
    const results = await dbClient.query.Strip.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Insert into Strip
app.post("/strips", async (req, res, next) => {
  try {
    const { b_id, s_date, s_latitude, s_longitude } = req.body;

    // Check for missing fields
    if (!b_id || !s_date || !s_latitude || !s_longitude === undefined) {
      throw new Error("Missing required fields: s_url, u_id, s_brand, s_location, s_ph");
    }

    // Insert new strip
    const result = await dbClient
      .insert(Strip)
      .values({ b_id, s_date, s_latitude, s_longitude })
      .returning(); // Returns inserted values

    res.status(201).json({
      msg: "Strip created successfully",
      data: result[0], // Return the first item from result
    });
  } catch (err) {
    next(err);
  }
});

// // Update strip in Strip
// app.patch("/strips/:id", async (req, res, next) => {
//   try {
//     const s_id = parseInt(req.params.id);
//     const { b_id, s_date, s_latitude, s_longitude } = req.body;
//     if (!b_id && !s_date && !s_latitude && !s_longitude === undefined) throw new Error("No data to update");

//     const result = await dbClient
//       .update(Strip)
//       .set({ b_id, s_date, s_latitude, s_longitude })
//       .where(eq(Strip.s_id, s_id))
//       .returning();
    
//     res.json({ msg: "Strip updated successfully", data: result });
//   } catch (err) {
//     next(err);
//   }
// });

// Delete strip from Strip
app.delete("/strips/:id", async (req, res, next) => {
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

// =================== BRANDS API ===================

// GET all brands
app.get("/brands", async (req, res) => {
  const brands = await dbClient.select().from(Brand);
  res.json(brands);
});

// POST new brand
app.post("/brands", async (req, res) => {
  const { b_name, b_chart } = req.body;
  if (!b_name) res.status(400).json({ error: "b_name is required" });

  const [newBrand] = await dbClient.insert(Brand).values({ b_name, b_chart }).returning();
  res.status(201).json(newBrand);
});

// PATCH update brand
app.patch("/brands/:id", async (req, res) => {
  const { id } = req.params;
  const { b_name, b_chart } = req.body;

  const [updatedBrand] = await dbClient.update(Brand).set({ b_name, b_chart }).where(eq(Brand.b_id, Number(id))).returning();

  if (!updatedBrand) res.status(404).json({ error: "Brand not found" });

  res.json(updatedBrand);
});

// =================== PARAMETER API ===================

// GET all parameters
app.get("/parameters", async (req, res) => {
  const parameters = await dbClient.select().from(Parameter);
  res.json(parameters);
});

// POST new parameter
app.post("/parameters", async (req, res) => {
  const { p_name, p_unit } = req.body;
  if (!p_name) res.status(400).json({ error: "p_name is required" });

  const [newParameter] = await dbClient.insert(Parameter).values({ p_name, p_unit }).returning();
  res.status(201).json(newParameter);
});

// PATCH update parameter
app.patch("/parameters/:id", async (req, res) => {
  const { id } = req.params;
  const { p_name, p_unit } = req.body;

  const [updatedParameter] = await dbClient.update(Parameter).set({ p_name, p_unit }).where(eq(Parameter.p_id, Number(id))).returning();

  if (!updatedParameter) res.status(404).json({ error: "Parameter not found" });
  res.json(updatedParameter);
});


// =================== STRIPS PARAMETER API ===================

// Get All from Strip paramenter
app.get("/strips_parameter", async (req, res, next) => {
  try {
    const results = await dbClient.query.StripParameter.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// Insert into Strip parameter
app.post("/strips_parameter", async (req, res, next) => {
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
app.patch("/strip-parameters/:s_id/:p_id", async (req, res, next) => {
  try {
    const { s_id, p_id } = req.params;
    const { sp_value } = req.body;

    // Validate input
    if (!sp_value) {
      res.status(400).json({ error: "Missing required field: sp_value" });
    }

    // Update query
    const result = await dbClient
      .update(StripParameter)
      .set({ sp_value })
      .where(
        and(eq(StripParameter.s_id, Number(s_id)), eq(StripParameter.p_id, Number(p_id)))
      )
      .returning();

    // Check if the update was successful
    if (result.length === 0) {
      res.status(404).json({ error: "StripParameter not found" });
    }

    res.json({ msg: "StripParameter updated successfully", data: result[0] });
  } catch (err) {
    next(err);
  }
});



// =================== Error Handler ===================
const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let serializedError = JSON.stringify(err, Object.getOwnPropertyNames(err));
  serializedError = serializedError.replace(/\/+/g, "/").replace(/\\+/g, "/");
  res.status(500).send({ error: serializedError });
};
app.use(jsonErrorHandler);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle validation errors (e.g., missing fields)
  if (err.message.startsWith("Missing required fields")) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Handle not found errors
  if (err.message.includes("not found")) {
    res.status(404).json({ error: err.message });
    return;
  }

  // Handle invalid request errors
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  // Database-related errors
  if (err.code === "23505") {
    res.status(409).json({ error: "Duplicate entry detected" });
    return;
  }

  if (err.code === "22P02") {
    res.status(400).json({ error: "Invalid input type" });
    return;
  }

  // Default to a generic 500 Internal Server Error
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
  });
  return;
};

// Use the custom error handler
app.use(errorHandler);

// =================== Server ===================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
