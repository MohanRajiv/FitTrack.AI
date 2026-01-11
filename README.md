# FitTrack.AI

**FitTrack.AI** is a comprehensive fitness and nutrition web application. It uses **Google Gemini 2.0 Flash** to analyze food images for nutrients and generate personalized workout routines. By integrating the **USDA Food Database**, it provides high-accuracy nutritional logging to help users hit their goals.

## 🚀 Key Features

- **AI Food Recognition**: Upload a photo or type a meal description. The AI extracts the food name and automatically fetches Calories, Protein, Carbs, and Fats.
- **Smart Workout Generator**: Generate routines based on your goals that pull only from a verified list of exercises.
- **AI Meal Planning**: Get structured breakfast, lunch, and dinner plans via text prompts.
- **Automated Logging**: Dynamically creates MySQL tables for each user and date to keep logs organized and scalable.
- **Custom Food List**: Save your favorite meals for 1-click logging in the future.

## 🛠 Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MySQL (relational logging)
- **AI**: Google Generative AI (Gemini 2.0 Flash)
- **Data**: USDA FoodData Central API

## How to run

1. **Configure Environment Variables**
Before running the server, create a .env file in the /server directory with the following:

```bash
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

GEMINI_API_KEY (from Google AI Studio)

USDA_API_KEY (from USDA FoodData Central)
```

2. **Start the Backend**

   Go to the server directory, you can run:

```bash
cd server
```
3. **In the server directory, type the following command**

```bash
node server.js
```

4. **Start the Frontend**

    Once the command successfully runs, type cd .. to go back to the root directory, then type:

```bash
cd client
```

5. **Finally, to run the app, type**

```bash
npm start
```

6. Open **http://localhost:3000** to view it in your browser.

