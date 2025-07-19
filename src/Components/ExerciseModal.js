import React, { useState, useEffect } from "react";
import "./Modal.css";

function SelectExercise({ closeExerciseModal, onExerciseSelect }) {
    const [selectedExercise, setSelectedExercise] = useState("");
    const [exercises, setExercises] = useState([]);
    const [error, setError] = useState(null); // To track any fetch errors
    const[errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        fetch("/exercises.json")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch exercises.");
                }
                return response.json();
            })
            .then((data) => setExercises(data))
            .catch((error) => {
                console.error("Error fetching exercises:", error);
                setError("Failed to load exercises. Please try again later.");
            });
    }, []);

    const handleSelectChange = (e) => {
        setSelectedExercise(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedExercise) {
            setErrorMessage("error")
            return;
        } 
        else {
            setErrorMessage("")
            onExerciseSelect(selectedExercise);
            closeExerciseModal();
        }
    };

    return (
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container") closeExerciseModal();
            }}
        >
            <div className="modal">
                {error ? (
                    <p className="error-message">{error}</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h3>Select Exercise</h3>
                        <div className="form-group">
                            <label htmlFor="exercise">Exercise:</label>
                            <select
                                name="exercise"
                                value={selectedExercise}
                                onChange={handleSelectChange}
                            >
                                <option value="" disabled>
                                    -- Select an exercise --
                                </option>
                                {exercises.map((exercise) => (
                                    <option key={exercise.id} value={exercise.name}>
                                        {exercise.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errorMessage && <div className="error">{`Please include an exercise`}</div>}
                        <button type="submit" className="btn">
                            Submit
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default SelectExercise;
