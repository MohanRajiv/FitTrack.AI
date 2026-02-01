import 'dotenv/config';
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url'; 
import { agent } from "./react-agent/agent.js";
import { GoogleGenAI } from "@google/genai"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

const exercisesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "public", "exercises.json"), "utf8")
);

const app = express();
app.use(cors());
app.use(express.json()); 

console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No");
console.log("Food API Key loaded:", process.env.USDA_API_KEY ? "Yes" : "No");
console.log("DB Host:", process.env.DB_HOST);
console.log("DB Port:", process.env.DB_PORT);
console.log("DB User:", process.env.DB_USER);
console.log("DB Password:", process.env.DB_PASSWORD);
console.log("DB Name:", process.env.DB_NAME);

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const db = mysql.createConnection({
    host: process.env.DB_HOST,   
    port: process.env.DB_PORT,  
    user: process.env.DB_USER,         
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

app.get("/health", (_, res) => {
  res.status(200).json({ message: "OK" });
});

/*
  Gemini Integration
*/
app.post("/get-agent-text", upload.single("image"), async (req, res) => {
  try {
    const userInput = req.body.message;
    const imageFile = req.file;
    const pageSize = parseInt(req.body.pageSize) || 1;

    if (!userInput && !imageFile) {
      return res.status(400).json({ error: "No input provided" });
    }

    const content = [];
    
    content.push({ 
      type: "text", 
      text: `User query: ${userInput || "Analyze this image."}. 
             Please return exactly ${pageSize} different variations/results for this food.` 
    });

    if (imageFile) {
      content.push({
        type: "image_url",
        image_url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`,
      });
    }

    const agentResult = await agent.invoke({
      messages: [
        { 
          role: "user", 
          content: content 
        }
      ],
    });

    const lastMessage = agentResult.messages[agentResult.messages.length - 1];
    
    console.log("Raw Last Message Content:", lastMessage.content);

    let finalReply = "";
    if (typeof lastMessage.content === "string") {
      finalReply = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textPart = lastMessage.content.find(part => part.type === "text");
      finalReply = textPart ? textPart.text : "No text response generated.";
    }

    res.status(200).json({
      reply: finalReply || "The agent processed the data but returned an empty response.",
    });

  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
});

app.post("/get-gemini-exercise-text", async (req, res) => {
  try {
    const userInput = req.body.message;
    if (!userInput) {
      return res.status(400).json({ error: "No input provided" });
    }

    const exerciseNames = exercisesData.map((e) => e.name);

    const parts = [];
    const promptText = `
      You are an exercise routine expert. The user says: "${userInput}".
      You must ONLY use exercises from this list: ${exerciseNames.join(", ")}.
      For each exercise you choose, output in this strict format:
      Exercise:{}, Weight:{} lbs, Reps:{}.

      - If more than one set, repeat the exercise with different reps/weight.
      - Do not include any explanations or extra text, just the routine.
    `;

    parts.push({ text: userInput ? `${promptText}\nInput: ${userInput}` : promptText });

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: parts }],
    });    

    const output = response.text;

    res.status(200).json({ reply: output });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      error: "Failed to fetch from Gemini",
      details: error.message,
    });
  }
});

app.post("/get-gemini-food-text", async (req, res) => {
  try {
    const userInput = req.body.message;
    if (!userInput) {
      return res.status(400).json({ error: "No input provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const promptText = `
    You are a meal plan expert. Create a meal plan based on "${userInput}".
    Return ONLY in this format — no extra text, no units, no explanations:
    
    **Breakfast**
    * Food name, Calories:###, Protein:###, Carbs:###, Fats:###
    
    **Lunch**
    * Food name, Calories:###, Protein:###, Carbs:###, Fats:###
    
    **Dinner**
    * Food name, Calories:###, Protein:###, Carbs:###, Fats:###
    `;

    const response = await model.generateContent(promptText);
    const output = await response.response.text();

    res.status(200).json({ reply: output });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      error: "Failed to fetch from Gemini",
      details: error.message,
    });
  }
});

/*
  Login and Register Integration
*/
app.post("/sync-user", (req, res) => {
  const { userID, email, name } = req.body;

  if (!userID || !email) {
    return res.status(400).send("Missing required fields");
  }

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS gymUsers (
      userID VARCHAR(255) PRIMARY KEY,
      email VARCHAR(50),
      name VARCHAR(50)
    )
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating table:", err);
      return res.status(500).send("DB error");
    }

    const insertQuery = `
      INSERT INTO gymUsers (userID, email, name)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        name = VALUES(name)
    `;

    db.query(insertQuery, [userID, email, name], (err) => {
      if (err) {
        console.error("Error syncing user:", err);
        return res.status(500).send("DB error");
      }

      return res.sendStatus(200);
    });
  });
});

/*
  Workout Table Endpoints
*/
app.post("/create-workout-table", (req, res) => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    exercise_name VARCHAR(255),
    weight FLOAT,
    reps INT,
    workout_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;

  db.query(createTableQuery, (err) => { 
    if (err) {
        console.error("Error creating table:", err);
        res.status(500).send("Error creating exercise table.");
        return;
    }
    res.status(200).send("Exercise table created successfully.");
  });
});

app.post("/delete-workout-table", (req, res) => {
  const { userID, date } = req.body;

  if (!userID || !date) {
    console.error("Missing userId or date in request body:", req.body);
    res.status(400).send("Missing userId or date in request body.");
    return;
  }

  const deleteUserExercisesQuery = `DELETE FROM exercises WHERE user_id = ? AND workout_date = ?`;
  db.query(deleteUserExercisesQuery, [userID, date], (err, result) => {
    if (err) {
      console.error("Error deleting from table:", err);
      res.status(500).send("Error deleting from exercise table.");
      return;
    }

    if (result && result.affectedRows === 0) {
      return res.status(404).json({ message: "No workout exists for this date." });
    }

    res.status(200).send("Succesfully deleted from exercise table.");
  });
});

app.post("/add-set", (req, res) => {
  const { userID, exercise, weight, reps, setNumber, date } = req.body;
  console.log("Received data:", req.body);

  if (!userID || !exercise || !weight || !reps || !setNumber || !date) {
      console.error("Missing required fields:", req.body);
      res.status(400).send("Missing required fields.");
      return;
  }

  const query = `
      INSERT INTO exercises (user_id, exercise_name, weight, reps, workout_date)
      VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [userID, exercise, weight, reps, date], (err, result) => {
      if (err) {
          console.error("Error adding set:", err);
          res.status(500).send("Error adding set to database.");
          return;
      }
      console.log("Insert result:", result);
      res.status(200).json({ id: result.insertId, weight, reps, date });
  });
});
  
app.post("/delete-set", (req, res) => {
  const { userID, id, date } = req.body;

  if (!userID || !id || !date) {
      console.error("Missing required fields:", req.body);
      res.status(400).send("Missing required fields.");
      return;
  }

  const query = `DELETE FROM exercises WHERE user_id =? AND id =? AND workout_date=?`;

  db.query(query, [userID, id, date], (err, result) => {
      if (err) {
          console.error("Error deleting set:", err);
          res.status(500).send("Error deleting set from database.");
          return;
      }
      console.log("Set deleted successfully:", result);
      res.status(200).send("Set deleted successfully.");
  });
});

app.post("/edit-set", (req, res) => {    
  const { userID, id, weight, reps, date } = req.body;
  console.log("Received data for /edit-set:", { userID, id, weight, reps });
  
  if (!userID || !id || weight === undefined || reps === undefined || !date) {
    console.error("Missing or invalid fields in request body:", req.body);
    res.status(400).send("Missing or invalid fields in request body.");
    return;
  }
  
  const query = `UPDATE exercises SET weight = ?, reps = ? WHERE id =? AND user_id=? AND workout_date=?`;
  console.log("Executing query:", query);
  
  db.query(query, [weight, reps, id, userID, date], (err, result) => {
    if (err) {
      console.error("Error editing set:", err);
      res.status(500).send("Error editing set in database.");
      return;
    }
    console.log("Set edited successfully:", result);
    res.status(200).send("Set edited successfully.");
  });
});

app.post("/get-exercises", (req, res) => {
  const { userID, date } = req.body;
  
  if (!userID || !date) {
    return res.status(400).send("Missing required fields.");
  }
  
  const fetchDataQuery = `SELECT * FROM exercises WHERE user_id = ? AND workout_date = ?`;

  db.query(fetchDataQuery, [userID, date], (err, rows) => {
    if (err) {
      console.error("Error fetching exercises:", err);
      return res.status(500).send("Error fetching exercises.");
    } 
  
    if (rows.length === 0) {
      console.log(`No entries found for User: ${userID} on Date: ${date}`);
      return res.status(200).json({ exercises: [] });
    }
  
    console.log("Fetched exercises:", rows);
    res.status(200).json({ exercises: rows });
  });
});

app.post("/save-routine", (req, res) => {
  const { userID, date, exercises } = req.body;
  
  if (!userID || !date || !exercises) {
    console.error("Missing required fields:", req.body);
    return res.status(400).send("Missing required fields.");
  }
  
  const insertQuery = `
    INSERT INTO exercises (user_id, exercise_name, weight, reps, workout_date)
    VALUES ?
  `;
  
  const values = [];
  exercises.forEach((exerciseObj) => {
    exerciseObj.rows.forEach((row) => {
      values.push([exerciseObj.exercise, row.weight, row.reps, date]);
    });
  });
  
    db.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error("Error inserting routine:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, inserted: result.affectedRows });
    });
});  

  /*
    Nutrition Log Integration
  */
  app.post("/create-nutrition-table", (req, res) => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      meal_type VARCHAR(50),
      food_name VARCHAR(255),
      calories FLOAT,
      protein FLOAT,
      carbs FLOAT,
      fats FLOAT,
      log_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    
    db.query(createTableQuery, (err) => { 
      if (err) {
          console.error("Error creating table:", err);
          res.status(500).send("Error creating exercise table.");
          return;
      }
      res.status(200).send("Exercise table created successfully.");
    });
  });    

  app.post("/delete-tracker", (req, res) => {
    const { userID, date } = req.body;
  
    if (!userID || !date) {
      console.error("Missing userId or date in request body:", req.body);
      res.status(400).send("Missing userId or date in request body.");
      return;
    }
  
    const deleteUserExercisesQuery = `DELETE FROM nutrition_logs WHERE user_id = ? AND log_date = ?`;
    db.query(deleteUserExercisesQuery, [userID, date], (err, result) => {
      if (err) {
        console.error("Error deleting from table:", err);
        res.status(500).send("Error deleting from exercise table.");
        return;
      }

      if (result && result.affectedRows === 0) {
        return res.status(404).json({ message: "No nutrition log exists for this date." });
      }

      res.status(200).send("Succesfully deleted from exercise table.");
    });
  });

  app.post("/add-food", (req, res) => {
    const {userId, meal, foodName, protein, fats, carbs, calories, date} = req.body;
    console.log("Received data:", req.body);
  
    if (!userId || !meal || !foodName || !protein || !fats || !carbs || !calories || !date) {
        console.error("Missing required fields:", req.body);
        res.status(400).send("Missing required fields.");
        return;
    }
  
    const query = `
        INSERT INTO nutrition_logs (user_id, meal_type, food_name, protein, fats, carbs, calories, log_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(query, [userId, meal, foodName, protein, fats, carbs, calories, date], (err, result) => {
        if (err) {
            console.error("Error adding food:", err);
            res.status(500).send("Error adding food to database.");
            return;
        }
        res.status(200).json({ success: true, id: result.insertId });
        console.log("Food added and response sent!");
    });
  });

  app.post("/delete-food", (req, res) => {
    const { userID, id, date } = req.body;
  
    if (!userID || !id || !date) {
        console.error("Missing required fields:", req.body);
        res.status(400).send("Missing required fields.");
        return;
    }

    const query = `DELETE FROM nutrition_logs WHERE id = ? AND user_id = ? AND log_date = ?`;
  
    db.query(query, [id, userID, date], (err) => {
        if (err) {
            console.error("Error deleting food:", err);
            res.status(500).send("Error deleting food from database.");
            return;
        }

        console.log("Food deleted successfully:");
        res.status(200).send("Food deleted successfully.");
    });
  });

  app.post("/edit-food", (req, res) => {
    const { userID, id, protein, fats, carbs, calories, date} = req.body;
    console.log("Received data for /edit-food:", { userID, id, protein, fats, carbs, calories, date});
  
    if (!userID || !id || protein === undefined || fats === undefined || carbs === undefined || calories === undefined || !date) {
        console.error("Missing or invalid fields in request body:", req.body);
        res.status(400).send("Missing or invalid fields in request body.");
        return;
    }

    const query = `UPDATE nutrition_logs SET protein = ?, fats = ?, carbs = ?, calories = ? WHERE id = ? AND user_id = ? AND log_date = ?`;
    console.log("Executing query:", query);
  
    db.query(query, [protein, fats, carbs, calories, id, userID, date], (err, result) => {
        if (err) {
            console.error("Error editing food:", err);
            res.status(500).send("Error editing food in database.");
            return;
        }
        console.log("Food edited successfully:", result);
        res.status(200).send("Food edited successfully.");
    });
  });

  app.post("/create-food-list", (req, res) => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS food_list (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      food_name VARCHAR(255),
      calories FLOAT,
      protein FLOAT,
      carbs FLOAT,
      fats FLOAT
    );`;
    
    db.query(createTableQuery, (err) => { 
      if (err) {
          console.error("Error creating table:", err);
          res.status(500).send("Error creating food list.");
          return;
      }
      res.status(200).send("Food list created successfully.");
    });
  });    

  app.post("/add-food-to-list", (req, res) => {
    const { userID, name, protein, fats, carbs, calories } = req.body;

    if (!userID || !name) {
        return res.status(400).send("Missing required fields.");
    }

    const checkQuery = `SELECT * FROM food_list WHERE food_name = ? AND user_id = ? LIMIT 1`;

    db.query(checkQuery, [name, userID], (err, results) => {
        if (err) {
            console.error("Error checking food in list:", err);
            return res.status(500).send("Database error.");
        }

        if (results.length > 0) {
            return res.status(409).send("Food already exists in the list.");
        }

        const insertQuery = 
          `INSERT INTO food_list (food_name, protein, fats, carbs, calories, user_id) 
           VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(insertQuery, [name, protein, fats, carbs, calories, userID], (err, result) => {
            if (err) {
                console.error("Error adding food to list:", err);
                return res.status(500).send("Database error.");
            }
            res.status(200).send("Food added to list.");
        });
    });
  });

  app.post("/get-food-list", (req, res) => {
    const { userID } = req.body;

    if (!userID) {
      return res.status(400).send("Missing required fields.");
    }

    const query = `SELECT * FROM food_list WHERE user_id=?`;

    db.query(query, [userID], (err, results) => {
        if (err) {
            console.error("Error fetching food list:", err);
            return res.status(500).send("Database error.");
        }
        res.json({ foodList: results });
    });
  });

  app.post("/get-logs", (req, res) => {
    const { userID, date } = req.body;
  
    if (!userID || !date) {
        console.error("Missing required fields:", req.body);
        res.status(400).send("Missing required fields.");
        return;
    }
  
    const checkTableQuery = `SELECT COUNT(1) FROM nutrition_logs WHERE user_id =? AND log_date=?`;
    db.query(checkTableQuery, [userID, date], (err, result) => {
        if (err) {
            console.error("Error checking table existence:", err);
            res.status(500).send("Error checking table existence.");
            return;
        }
  
        if (result.length === 0) {
            console.log("Row does not exist:");
            res.status(404).json({ message: "No calorie log found for this date." });
            return;
        }
  
        const fetchDataQuery = `SELECT * FROM nutrition_logs WHERE user_id =? AND log_date=?`;
        db.query(fetchDataQuery,  [userID, date], (err, rows) => {
            if (err) {
                console.error("Error fetching calorie log:", err);
                res.status(500).send("Error fetching calorie log.");
                return;
            }
  
            console.log("Fetched foods:", rows);
            res.status(200).json({ foods: rows });
        });
    });
  });

  app.post("/check-date-exists", (req, res) => {
    const { userID, date } = req.body;
  
    if (!userID || !date) {
      return res.status(400).json({ error: "Missing userID or date" });
    }
  
    const workoutCheck = "SELECT COUNT(*) AS count FROM exercises WHERE user_id = ? AND workout_date = ?";
    const foodCheck = "SELECT COUNT(*) AS count FROM nutrition_logs WHERE user_id = ? AND log_date = ?";
  
    db.query(workoutCheck, [userID, date], (err, workoutResult) => {
      if (err) return res.status(500).json({ error: "Workout check failed" });
  
      db.query(foodCheck, [userID, date], (err, foodResult) => {
        if (err) return res.status(500).json({ error: "Food check failed" });
  
        res.status(200).json({
          workoutExists: workoutResult[0].count > 0,
          foodExists: foodResult[0].count > 0
        });
      });
    });
  });

  app.post("/get-user-logs", (req, res) => {
    const { userID } = req.body;
  
    if (!userID) {
      console.error("Missing required field: userID");
      return res.status(400).send("Missing required field: userID");
    }
  
    const workoutQuery = `
      SELECT DISTINCT workout_date 
      FROM exercises 
      WHERE user_id = ?
      ORDER BY workout_date DESC
    `;
  
    const foodQuery = `
      SELECT DISTINCT log_date 
      FROM nutrition_logs 
      WHERE user_id = ?
      ORDER BY log_date DESC
    `;
  
    db.query(workoutQuery, [userID], (err, workoutResults) => {
      if (err) {
        console.error("Error fetching workout dates:", err);
        return res.status(500).send("Error fetching workout dates.");
      }
  
      const workoutDates = workoutResults.map(row => {
        const d = new Date(row.workout_date);
        return d.toISOString().split('T')[0];
      });
  
      db.query(foodQuery, [userID], (err, foodResults) => {
        if (err) {
          console.error("Error fetching food dates:", err);
          return res.status(500).send("Error fetching food dates.");
        }
  
        const foodDates = foodResults.map(row => {
          const d = new Date(row.log_date);
          return d.toISOString().split('T')[0];
        });
  
        console.log(`✅ Found ${workoutDates.length} workout days and ${foodDates.length} food days.`);
  
        res.status(200).json({
          workoutDates,
          foodDates,
        });
      });
    });
  });

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
