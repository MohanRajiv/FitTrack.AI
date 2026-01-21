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
      text: `Identify this food and use the get_nutrition_data tool to find the top ${pageSize} results by setting the 'count' parameter to ${pageSize}. User query: ${userInput || "Analyze this image."}` 
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
  Workout Integration
*/
app.post("/create-table", (req, res) => {
  const { userId, date } = req.body;

  if (!userId || !date) {
    console.error("Missing userId or date in request body:", req.body);
    res.status(400).send("Missing userId or date in request body.");
    return;
  }

  const sanitizedDate = date.replace(/-/g, '_');
  const tableName = `user_${userId}_exercises_${sanitizedDate}`;

  const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
  db.query(checkTableQuery, (err, result) => {
    if (err) {
      console.error("Error checking table existence:", err);
      res.status(500).send("Error checking table existence.");
      return;
    }

    if (result.length > 0) {
      res.status(409).json({ message: "A workout already exists for this date." });
      return;
    }

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exercise VARCHAR(255),
        weight INT,
        reps INT,
        date DATE
      )`;

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating table:", err);
        res.status(500).send("Error creating exercise table.");
        return;
      }
      res.status(200).send("Exercise table created successfully.");
    });
  });
});

app.post("/delete-workout-table", (req, res) => {
  const { userID, date } = req.body;

  if (!userID || !date) {
    console.error("Missing userId or date in request body:", req.body);
    res.status(400).send("Missing userId or date in request body.");
    return;
  }

  const sanitizedDate = date.replace(/-/g, '_');
  const tableName = `user_${userID}_exercises_${sanitizedDate}`;

  const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
  db.query(checkTableQuery, (err, result) => {
    if (err) {
      console.error("Error checking table existence:", err);
      res.status(500).send("Error checking table existence.");
      return;
    }

    if (result.length == 0) {
      res.status(409).json({ message: "No workout already exists for this date." });
      return;
    }

    const dropTableQuery = `DROP TABLE \`${tableName}\``;

    db.query(dropTableQuery, (err) => {
      if (err) {
        console.error("Error deleting table:", err);
        res.status(500).send("Error deleting exercise table.");
        return;
      }
      res.status(200).send("Exercise table deleting successfully.");
    });
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

  const sanitizedDate = date.replace(/-/g, '_');
  const tableName = `user_${userID}_exercises_${sanitizedDate}`;

  const query = `
      INSERT INTO \`${tableName}\` (exercise, weight, reps, date)
      VALUES (?, ?, ?, ?)
  `;

  db.query(query, [exercise, weight, reps, date], (err, result) => {
      if (err) {
          console.error("Error adding set:", err);
          res.status(500).send("Error adding set to database.");
          return;
      }
      console.log("Insert result:", result);
      const insertedId = result.insertId;
      const insertedWeight = result.weight;
      const insertedReps = result.reps;
      res.status(200).json({ id: insertedId, weight: insertedWeight, reps: insertedReps, date });
  });
});
  
app.post("/delete-set", (req, res) => {
  const { userID, id, date } = req.body;

  if (!userID || !id || !date) {
      console.error("Missing required fields:", req.body);
      res.status(400).send("Missing required fields.");
      return;
  }

  const sanitizedDate = date.replace(/-/g, '_');
  const tableName = `user_${userID}_exercises_${sanitizedDate}`;

  const query = `DELETE FROM \`${tableName}\` WHERE id = ?;`;

  db.query(query, [id], (err, result) => {
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
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_exercises_${sanitizedDate}`;
  
    const query = `UPDATE \`${tableName}\` SET weight = ?, reps = ? WHERE id = ?`;
    console.log("Executing query:", query);
  
    db.query(query, [weight, reps, id], (err, result) => {
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
        console.error("Missing required fields:", req.body);
        res.status(400).send("Missing required fields.");
        return;
    }
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_exercises_${sanitizedDate}`;
  
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    db.query(checkTableQuery, (err, result) => {
        if (err) {
            console.error("Error checking table existence:", err);
            res.status(500).send("Error checking table existence.");
            return;
        }
  
        if (result.length === 0) {
            console.log("Table does not exist:", tableName);
            res.status(404).json({ message: "No workout found for this date." });
            return;
        }
  
        const fetchDataQuery = `SELECT * FROM \`${tableName}\``;
        db.query(fetchDataQuery, (err, rows) => {
            if (err) {
                console.error("Error fetching exercises:", err);
                res.status(500).send("Error fetching exercises.");
                return;
            }
  
            console.log("Fetched exercises:", rows);
            res.status(200).json({ exercises: rows });
        });
    });
  });

  app.post("/save-routine", (req, res) => {
    const { userID, date, exercises } = req.body;
  
    if (!userID || !date || !exercises) {
      console.error("Missing required fields:", req.body);
      return res.status(400).send("Missing required fields.");
    }
  
    const sanitizedDate = date.replace(/-/g, "_");
    const tableName = `user_${userID}_exercises_${sanitizedDate}`;
  
    const insertQuery = `
      INSERT INTO \`${tableName}\` (exercise, weight, reps, date)
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
    Calorie Tracker Integration
  */
  app.post("/create-tracker", (req, res) => {
    const { userId, date } = req.body;

    if (!userId || !date) {
      onsole.error("Missing userId or date in request body:", req.body);
      res.status(400).send("Missing userId or date in request body.");
      return;
    }

    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userId}_calorieLog_${sanitizedDate}`;

    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    db.query(checkTableQuery, (err, result) => {
      if (err) {
        console.error("Error checking table existence:", err);
        res.status(500).send("Error checking table existence.");
        return;
      }

      if (result.length > 0) {
        res.status(409).json({ message: "A calorie log already exists for this date." });
        return;
      }

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          meal VARCHAR(255),
          foodName VARCHAR(255),
          protein INT,
          fats INT,
          carbs INT,
          calories INT,
          date DATE
        )`;

      db.query(createTableQuery, (err) => {
        if (err) {
          console.error("Error creating table:", err);
          res.status(500).send("Error creating calorie table.");
          return;
        }
        res.status(200).send("Calorie table created successfully.");
      });
    });
  });

  app.post("/delete-tracker", (req, res) => {
    const { userID, date } = req.body;
  
    if (!userID || !date) {
      console.error("Missing userId or date in request body:", req.body);
      res.status(400).send("Missing userId or date in request body.");
      return;
    }
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_calorieLog_${sanitizedDate}`;
  
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    db.query(checkTableQuery, (err, result) => {
      if (err) {
        console.error("Error checking table existence:", err);
        res.status(500).send("Error checking table existence.");
        return;
      }
  
      if (result.length == 0) {
        res.status(409).json({ message: "No calorie log already exists for this date." });
        return;
      }
  
      const dropTableQuery = `DROP TABLE \`${tableName}\``;
  
      db.query(dropTableQuery, (err) => {
        if (err) {
          console.error("Error deleting calorie log:", err);
          res.status(500).send("Error deleting calorie log.");
          return;
        }
        res.status(200).send("Calorie Log deleting successfully.");
      });
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
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userId}_calorieLog_${sanitizedDate}`;
  
    const query = `
        INSERT INTO \`${tableName}\` (meal, foodName, protein, fats, carbs, calories, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(query, [meal, foodName, protein, fats, carbs, calories, date], (err, result) => {
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
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_calorieLog_${sanitizedDate}`;
  
    const query = `DELETE FROM \`${tableName}\` WHERE id = ?;`;
  
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error deleting food:", err);
            res.status(500).send("Error deleting food from database.");
            return;
        }
        console.log("food deleted successfully:", result);
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
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_calorieLog_${sanitizedDate}`;
  
    const query = `UPDATE \`${tableName}\` SET protein = ?, fats = ?, carbs = ?, calories = ? WHERE id = ?`;
    console.log("Executing query:", query);
  
    db.query(query, [protein, fats, carbs, calories, id], (err, result) => {
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
    const { userId } = req.body;
  
    if (!userId) {
      console.error("Missing userID in request body:", req.body); 
      res.status(400).send("Missing userId in request body.");
      return;
    }
  
    const tableName = `user_${userId}_foodList`;
  
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    db.query(checkTableQuery, (err, result) => {
      if (err) {
        console.error("Error checking table existence:", err);
        res.status(500).send("Error checking table existence.");
        return;
      }
  
      if (result.length > 0) {
        return;
      }
  
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          foodName VARCHAR(255),
          protein INT,
          fats INT,
          carbs INT,
          calories INT
        )`; 
  
      db.query(createTableQuery, (err) => {
        if (err) {
          console.error("Error creating food list:", err);
          res.status(500).send("Error creating food list.");
          return;
        }
        res.status(200).send("Food List created successfully.");
      });
    });
  });
  

  app.post("/add-food-to-list", (req, res) => {
    const { userID, name, protein, fats, carbs, calories } = req.body;

    if (!userID || !name) {
        return res.status(400).send("Missing required fields.");
    }

    const tableName = `user_${userID}_foodList`;

    // Step 1: Check if food already exists in the user's list
    const checkQuery = `SELECT * FROM \`${tableName}\` WHERE foodName = ? LIMIT 1`;

    db.query(checkQuery, [name], (err, results) => {
        if (err) {
            console.error("Error checking food in list:", err);
            return res.status(500).send("Database error.");
        }

        if (results.length > 0) {
            // Food already exists
            return res.status(409).send("Food already exists in the list.");
        }

        // Step 2: Insert only if not exists
        const insertQuery = `INSERT INTO \`${tableName}\` (foodName, protein, fats, carbs, calories) VALUES (?, ?, ?, ?, ?)`;
        db.query(insertQuery, [name, protein, fats, carbs, calories], (err, result) => {
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

    const tableName = `user_${userID}_foodList`;
    const query = `SELECT * FROM \`${tableName}\``;

    db.query(query, (err, results) => {
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
  
    const sanitizedDate = date.replace(/-/g, '_');
    const tableName = `user_${userID}_calorieLog_${sanitizedDate}`;
  
    const checkTableQuery = `SHOW TABLES LIKE '${tableName}'`;
    db.query(checkTableQuery, (err, result) => {
        if (err) {
            console.error("Error checking table existence:", err);
            res.status(500).send("Error checking table existence.");
            return;
        }
  
        if (result.length === 0) {
            console.log("Table does not exist:", tableName);
            res.status(404).json({ message: "No calorie log found for this date." });
            return;
        }
  
        const fetchDataQuery = `SELECT * FROM \`${tableName}\``;
        db.query(fetchDataQuery, (err, rows) => {
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

  app.post("/get-user-logs", (req, res) => {
    const { userID } = req.body;
  
    if (!userID) {
      console.error("Missing required field: userID");
      res.status(400).send("Missing required field: userID");
      return;
    }
  
    const workoutTablePattern = `user_${userID}_exercises_%`;
    const foodTablePattern = `user_${userID}_calorieLog_%`;
  
    const workoutQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name LIKE '${workoutTablePattern}'
    `;
  
    const foodQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name LIKE '${foodTablePattern}'
    `;
  
    db.query(workoutQuery, (err, workoutResults) => {
      if (err) {
        console.error("Error fetching workout tables:", err);
        res.status(500).send("Error fetching workout tables.");
        return;
      }
  
      console.log("Workout tables:", workoutResults);
  
      const workoutDates = workoutResults
        .filter(row => row.table_name || row.TABLE_NAME)
        .map(row => {
          const tableName = row.table_name || row.TABLE_NAME;
          const parts = tableName.split("_");

          if (parts.length >= 3) {
            const day = parts.pop();
            const month = parts.pop();
            const year = parts.pop();
            return `${year}-${month}-${day}`;
          }
    
          console.warn("Unexpected table name format:", tableName);
          return null;
        })
      .filter(Boolean);
  
      // 2️⃣ Get food tables
      db.query(foodQuery, (err, foodResults) => {
        if (err) {
          console.error("Error fetching food tables:", err);
          res.status(500).send("Error fetching food tables.");
          return;
        }
  
        console.log("Food tables:", foodResults);

        const foodDates = foodResults
        .filter(row => row.table_name || row.TABLE_NAME)
        .map(row => {
          const tableName = row.table_name || row.TABLE_NAME;
          const parts = tableName.split("_");

          if (parts.length >= 3) {
            const day = parts.pop();
            const month = parts.pop();
            const year = parts.pop();
            return `${year}-${month}-${day}`;
          }
    
          console.warn("Unexpected food table name:", tableName);
          return null;
        })
        .filter(Boolean);
  
        console.log("✅ Workout Dates:", workoutDates);
        console.log("✅ Food Dates:", foodDates);
  
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
