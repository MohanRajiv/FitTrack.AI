import React, { useState } from "react";
import "./Modal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";

function MealPlanModal({ closeMealPlanModal, onMealPlanSubmit }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResponse, setSearchResponse] = useState("");
  const [parsedFoods, setParsedFoods] = useState([]);

  const handleInputChange = (value) => {
    setSearchInput(value);
  };

  const handleSearchClick = async (inputValue) => {
    setSearchInput(inputValue);

    try {
      const res = await axios.post(
        "http://localhost:3001/get-gemini-food-text",
        { message: inputValue }
      );
      const textResponse = res.data.reply;
      setSearchResponse(textResponse);

      // 🔍 Parse meals by section (Breakfast / Lunch / Dinner)
      const sectionRegex = /\*\*(Breakfast|Lunch|Dinner)\*\*/gi;
      const sections = textResponse.split(sectionRegex);

      const meals = [];
      for (let i = 1; i < sections.length; i += 2) {
        const sectionName = sections[i].trim();
        const sectionText = sections[i + 1];

        // 🥘 Parse each food line in the section
        const foodRegex =
          /\* (.+?), Calories:(\d+), Protein:(\d+), Carbs:(\d+), Fats:(\d+)/g;
        let match;
        while ((match = foodRegex.exec(sectionText)) !== null) {
          meals.push({
            section: sectionName,
            food: match[1].trim(),
            calories: parseInt(match[2]),
            protein: parseInt(match[3]),
            carbs: parseInt(match[4]),
            fats: parseInt(match[5]),
          });
        }
      }

      setParsedFoods(meals);
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setSearchResponse("Error fetching Gemini response.");
    }
  };

  const handleSubmit = () => {
    if (parsedFoods.length > 0) {
      onMealPlanSubmit(parsedFoods);
      closeMealPlanModal();
    }
  };

  return (
    <div
      className="modal-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMealPlanModal();
      }}
    >
      <div className="modal">
        <h3>Generate Meal Plan</h3>
        <div className="search-bar-container">
          <SearchBar
            onInputChange={handleInputChange}
            onSearchClick={handleSearchClick}
            showComponents={false}
          />
        </div>

        {searchResponse && (
          <div className="search-message">
            <p>
              <strong>Gemini Meal Plan:</strong>
            </p>

            <ul>
              {parsedFoods.map((meal, index) => (
                <li key={index}>
                  <strong>{meal.section}</strong> — {meal.food} <br />
                  {meal.calories} kcal | {meal.protein}g protein | {" "}
                  {meal.carbs}g carbs | {meal.fats}g fats
                </li>
              ))}
            </ul>

            <button className="btn" onClick={handleSubmit}>
              Add Meal Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MealPlanModal;
