import React, { useState } from "react";
import "./RoutineModal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";

function RoutineModal({ closeRoutineModal, onRoutineSubmit }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResponse, setSearchResponse] = useState("");
  const [parsedExercises, setParsedExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  // New UI states for user preferences
  const [targetSets, setTargetSets] = useState(15);
  const [repRange, setRepRange] = useState("10-12");
  const [equipment, setEquipment] = useState(["dumbbell", "cable", "bench", "barbell"]);
  const [injuries, setInjuries] = useState("");

  const equipmentOptions = [
    "barbell", 
    "dumbbell", 
    "cable", 
    "machine", 
    "kettlebells", 
    "bands", 
    "medicine ball", 
    "exercise ball", 
    "e-z curl bar", 
    "body only", 
    "foam roll", 
    "other"
  ];

  const handleInputChange = (value) => {
    setSearchInput(value);
  };

  const handleEquipmentToggle = (item) => {
    setEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSearchClick = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/generate-workout`,
        { 
          message: searchInput,
          targetSets,
          repRange,
          equipment,
          injuries: injuries || "none"
        }
      );

      setSearchResponse(res.data.reply);
      const formattedExercises = res.data.workout.map(ex => ({
        exercise: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        weight: 0 
      }));
      setParsedExercises(formattedExercises);
    } catch (err) {
      console.error("Error calling Workout API:", err);
      setSearchResponse("Error generating routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-container" onClick={(e) => e.target === e.currentTarget && closeRoutineModal()}>
      <div className="modal">
        <h3>AI Workout Generator</h3>
        
        {/* --- UI INPUTS SECTION --- */}
        <div className="prefs-container">
          <div className="input-group">
            <label>Target Total Sets:</label>
            <input 
              type="number" 
              value={targetSets} 
              onChange={(e) => setTargetSets(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Rep Range:</label>
            <select value={repRange} onChange={(e) => setRepRange(e.target.value)}>
              <option value="3-5">3-5 (Strength)</option>
              <option value="8-12">8-12 (Hypertrophy)</option>
              <option value="15-20">15-20 (Endurance)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Injuries/Limitations:</label>
            <input 
              type="text" 
              placeholder="e.g. lower back pain" 
              value={injuries} 
              onChange={(e) => setInjuries(e.target.value)} 
            />
          </div>

          <div className="equipment-grid">
            <p>Available Equipment:</p>
            {equipmentOptions.map(item => (
<button 
  key={item}
  type="button" 
  className={`chip ${equipment.includes(item) ? "selected" : ""}`}
  onClick={() => handleEquipmentToggle(item)}
>
  {item}
  {equipment.includes(item) && <span className="checkmark"> ✓</span>}
</button>
            ))}
          </div>
        </div>

        <div className="search-bar-container">
          <SearchBar
            onInputChange={handleInputChange}
            showComponents={false}
          />
        </div>

        <button 
            className="btn" 
            onClick={handleSearchClick}
          >
            Test Agent Analysis
          </button>

        {loading && <div className="loader">Optimizing volume and CNS fatigue...</div>}

        {searchResponse && !loading && (
          <div className="search-message">
            <div className="coach-reply">
              <p style={{ whiteSpace: "pre-line", fontSize: "0.85rem" }}>{searchResponse}</p>
            </div>
            <button className="btn" onClick={() => onRoutineSubmit(searchResponse)}>
              Confirm Routine
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoutineModal;