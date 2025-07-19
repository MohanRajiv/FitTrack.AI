require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const axios = require('axios');
const stringSimilarity = require('string-similarity');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const upload = multer({storage: multer.memoryStorage()});

const app = express();
app.use(cors());
app.use(express.json()); 

console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No");
console.log("Food API Key loaded:", process.env.USDA_API_KEY ? "Yes" : "No");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const db = mysql.createConnection({
    host: "127.0.0.1",   
    port: 3306,  
    user: "root",         
    password: "password", 
    database: "gymdb",     
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL");
});

/*
  Gemini Integration
*/
app.post("/get-gemini-text", upload.single('image'), async (req, res) => { 
  try {
    const userInput = req.body.message;
    const imageFile = req.file;

    if (!userInput && !imageFile) {
      return res.status(400).json({ error: "No input provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const parts = [];

    const promptText = `You are a nutrition expert. Analyze the food given in 
    the image (consider the serving size of the food in the image and update the 
    nutrition amounts accordingly) or text and provide information in the following
    strict format: Name:{}, Protein:{}, Fats:{}, Carbs:{}, Calories:{}. Don't include the 
    grams unit. No extra text.`;

    if (userInput) {
        parts.push({ text: `${promptText}\nInput: ${userInput}` });
    } else {
        parts.push({ text: promptText });
    }

    if (imageFile) {
      parts.push({
        inlineData: {
          mimeType: imageFile.mimetype,
          data: imageFile.buffer.toString("base64")
        }
      });
    }

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: parts
      }]
    });

    const response = await result.response.text();

    const nameMatch = response.match(/Name:\s*(.*?),/i);
    const foodName = nameMatch ? nameMatch[1].trim() : null;
    console.log("Extracted food name for USDA lookup:", foodName);

    let usdaNutrition = null; 
    if (foodName) {
      usdaNutrition = await getNutritionFromUSDA(foodName);
    }

    res.status(200).json({
      reply: response,
      usda: usdaNutrition
    });

  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ 
      error: "Failed to fetch from Gemini",
      details: error.message 
    });
  }
});

/*
  Login and Register Integration
*/
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  
  const query = "INSERT INTO gymUsers (name, email, password) VALUES (?, ?, ?)";
  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error("Error inserting data:", err);
      res.status(500).send("Error registering user");
      return;
    }
    res.status(200).send("User registered successfully");
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", email, password);
    
  const query = "SELECT * FROM gymUsers WHERE email = ? AND password = ?";
  db.query(query, [email, password], (err, result) => {
    if (err) {
      console.error("Database query error:", err);
      res.status(500).send("Error logging in");
      return;
    }
    console.log("Query result:", result);
    if (result.length > 0) {
      res.status(200).json({user: result[0]});
    } else {
      res.status(401).send("Invalid email or password");
    }
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

app.post("/add-set", (req, res) => {
  const { userId, exercise, weight, reps, setNumber, date } = req.body;
  console.log("Received data:", req.body);

  if (!userId || !exercise || !weight || !reps || !setNumber || !date) {
      console.error("Missing required fields:", req.body);
      res.status(400).send("Missing required fields.");
      return;
  }

  const sanitizedDate = date.replace(/-/g, '_');
  const tableName = `user_${userId}_exercises_${sanitizedDate}`;

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

  app.post("/add-food-to-list", (req, res) => {
    const { userID, name, protein, fats, carbs, calories } = req.body;
    if (!userID || !name) {
        return res.status(400).send("Missing required fields.");
    }
    const query = `INSERT INTO user_food_list (userID, name, protein, fats, carbs, calories) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(query, [userID, name, protein, fats, carbs, calories], (err, result) => {
        if (err) {
            console.error("Error adding food to list:", err);
            return res.status(500).send("Database error.");
        }
        res.status(200).send("Food added to list.");
    });
  });

  app.post("/get-food-list", (req, res) => {
    const { userID } = req.body;
    if (!userID) return res.status(400).send("Missing userID.");
    db.query("SELECT * FROM user_food_list WHERE userID = ?", [userID], (err, results) => {
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

  async function getNutritionFromUSDA(approximateName) {
    try {
      const searchRes = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
        params: {
          api_key: process.env.USDA_API_KEY,
          query: approximateName,
          pageSize: 1
        }
      });
  
      const foods = searchRes.data.foods;
      if (!foods || foods.length === 0) throw new Error("No foods found");
  
      const firstFood = foods[0];
      console.log("USDA Search Match:", firstFood);
  
      const fdcId = firstFood.fdcId;
  
      const foodRes = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}`, {
        params: {
          api_key: process.env.USDA_API_KEY
        }
      });
  
      const nutrients = Array.isArray(foodRes.data.foodNutrients) ? foodRes.data.foodNutrients : [];
    
      const get = (name) => {
        const item = nutrients.find(n =>
          n &&
          typeof n.nutrientName === 'string' &&
          n.nutrientName.toLowerCase().includes(name.toLowerCase())
        );
        return item && typeof item.value === 'number' ? parseFloat(item.value.toFixed(2)) : null;
      };
  
      return {
        name: firstFood.description,
        servingSize: foodRes.data.servingSize + ' ' + foodRes.data.servingSizeUnit,
        category: foodRes.data.foodCategory,
        calories: get('energy'),
        protein: get('protein'),
        fat: get('fat'),
        saturatedFat: get('saturated'),
        transFat: get('trans'),
        carbs: get('carbohydrate'),
        sugars: get('sugar'),
        fiber: get('fiber'),
      };
  
    } catch (error) {
      console.error("USDA Matching Error:", error.message);
      return null;
    }
  }

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });