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

## Getting Started with Create React App
This project was bootstrapped with Create React App.

How to run
1. Configure Environment Variables
Before running the server, create a .env file in the /server directory with the following:

DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

GEMINI_API_KEY (from Google AI Studio)

USDA_API_KEY (from USDA FoodData Central)

2. Start the Backend
Go to the server directory, you can run:

**cd server**
In the server directory, type the following command:

**node server.js**
3. Start the Frontend
Once the command successfully runs, type cd .. to go back to the root directory, then type:

**cd client**
Finally, to run the app, type:

**npm start**
Runs the app in the development mode.

Open **http://localhost:3000** to view it in your browser.

