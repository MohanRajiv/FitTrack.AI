import React, { useState } from "react";
import "./Modal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";

function RoutineModal({ closeRoutineModal, onRoutineSubmit}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResponse, setSearchResponse] = useState("");
  const [parsedExercises, setParsedExercises] = useState([]);

  const handleInputChange = (value) => {
    setSearchInput(value);
  };

  const handleSearchClick = async (inputValue) => {
    setSearchInput(inputValue);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/get-gemini-exercise-text`,
        { message: inputValue }
      );
      const textResponse = res.data.reply;
      setSearchResponse(textResponse);

      const matches = textResponse.matchAll(
        /Exercise:(.*?),\s*Weight:(\d+)\s*lbs,\s*Reps:(\d+)/g
      );

      const exercises = Array.from(matches, (m) => ({
        exercise: m[1].trim(),
        weight: m[2],
        reps: m[3],
      }));

      setParsedExercises(exercises);
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setSearchResponse("Error fetching Gemini response.");
    }
  };

  const handleSubmit = () => {
    if (parsedExercises.length > 0) {
      onRoutineSubmit(parsedExercises); 
      closeRoutineModal();
    }
  };

  return (
    <div
      className="modal-container"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRoutineModal();
      }}
    >
      <div className="modal">
        <h3>Generate Exercise Routine</h3>
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
              <strong>Gemini Routine:</strong>
            </p>
            <ul>
              {parsedExercises.map((ex, index) => (
                <li key={index}>
                  {ex.exercise} — {ex.weight} lbs — {ex.reps} reps
                </li>
              ))}
            </ul>
            <button className="btn" onClick={handleSubmit}>
              Add routine
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default RoutineModal;
