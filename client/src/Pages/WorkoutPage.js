import "./App.css";
import React, { useState, useEffect } from "react";
import Table from "../Components/TableComponents/Table";
import Modal from "../Components/Modal";
import SelectExercise from "../Components/ExerciseModal";
import RoutineModal from "../Components/RoutineModal";
import {useUser, UserButton} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

function WorkoutPage(){
    const [modelOpen, setModelOpen] = useState(false);
    const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
    const [routineModalOpen, setRoutineModalOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [exerciseTables, setExerciseTables] = useState([]);
    const [rowToEdit, setRowToEdit] = useState(null);
    const [currentTableIdx, setCurrentTableIdx] = useState(null);
    const [workoutDate, setWorkoutDate] = useState(null);
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const storedDate = localStorage.getItem("workoutDate");

        if (!storedDate) {
            console.warn("No date selected, redirecting to user page.");
            navigate("/user");
            return;
        }
    
        setWorkoutDate(storedDate);

        if (user) {
            setUserName(user.fullName);
    
            const fetchExercises = async () => {
                try {
                    const response = await fetchFromBackend(`${process.env.REACT_APP_API_URL}/get-exercises`, "POST", {
                        userID: user.id,
                        date: storedDate
                    });
    
                    if (response.exercises && response.exercises.length > 0) {
                        const exercisesMap = new Map();
                        response.exercises.forEach((row) => {
                            const name = row.exercise_name;
                            if (!exercisesMap.has(name)) {
                                exercisesMap.set(name, []);
                            }
                            exercisesMap.get(name).push(row);
                        });
    
                        const tables = Array.from(exercisesMap).map(([exercise, rows]) => ({
                            exercise,
                            rows,
                        }));
    
                        setExerciseTables(tables);
                    }
                } catch (error) {
                    console.error("Error fetching exercises:", error);
                }
            };
            fetchExercises();
        }
    }, [user, navigate]);

    const handleAddExercise = async (exercise) => {
        if (!exercise) {
            alert("Please select an exercise before adding.");
            return;
        }
    
        const existingIdx = exerciseTables.findIndex((t) => t.exercise === exercise);
        
        if (existingIdx !== -1) {
            alert(`${exercise} already exists in your workout.`);
            // Optional: Open the modal anyway for the existing exercise
            // setCurrentTableIdx(existingIdx);
            // setModelOpen(true);
            return;
        }
        
        try {
            const newTable = { exercise, rows: [] };
            const newTables = [...exerciseTables, newTable];
            
            setExerciseTables(newTables);
            
            setCurrentTableIdx(exerciseTables.length); 
            
            setModelOpen(true);
            
        } catch (error) {
            alert(`Failed to add exercise: ${error.message}`);
        }
    };

    const handleAddSet = async (newRow) => {
        console.log("newRow in handleAddSet:", newRow); 
        const workoutDate = localStorage.getItem("workoutDate");
    
        if (currentTableIdx !== null) {
            const updatedTables = [...exerciseTables];
            const tableToUpdate = updatedTables[currentTableIdx];
    
            const setsCount = parseInt(newRow.sets, 10);
            const newRows = [];
    
            for (let i = 1; i <= setsCount; i++) {
                const set = { ...newRow, setNumber: i };
                try {
                    const data = await fetchFromBackend(`${process.env.REACT_APP_API_URL}/add-set`, "POST", {
                        userID: user.id,
                        exercise: tableToUpdate.exercise,
                        weight: set.weight,
                        reps: set.reps,
                        setNumber: i,
                        date: workoutDate,
                    });
                    set.id = data.id;
                    newRows.push(set);
                } catch (error) {
                    alert(`Error adding set: ${error.message}`);
                    return;
                }
            }
    
            tableToUpdate.rows = [...tableToUpdate.rows, ...newRows];
            setExerciseTables(updatedTables);
        }
    };

    const handleEditSet = async (updatedRow) => {
        const workoutDate = localStorage.getItem("workoutDate");
    
        if (currentTableIdx !== null) {
            const updatedTables = [...exerciseTables];
            const tableToUpdate = updatedTables[currentTableIdx];
            const rowToUpdate = tableToUpdate.rows[rowToEdit];
    
            rowToUpdate.weight = updatedRow.weight;
            rowToUpdate.reps = updatedRow.reps;
            rowToUpdate.sets = updatedRow.sets;
    
            try {
                await fetchFromBackend(`${process.env.REACT_APP_API_URL}/edit-set`, "POST", {
                    userID: user.id,
                    id: rowToUpdate.id,
                    weight: updatedRow.weight,
                    reps: updatedRow.reps,
                    date: workoutDate, 
                });
                console.log("Set updated successfully.");
            } catch (error) {
                alert(`Error updating set: ${error.message}`);
                return;
            }
    
            setExerciseTables(updatedTables);
            setRowToEdit(null);
        }
    };

    const handleEditRow = (tableIdx, rowIdx) => {
        setRowToEdit(rowIdx);
        setCurrentTableIdx(tableIdx);
        setModelOpen(true);
    };

    const handleDeleteRow = async (tableIdx, rowIdx) => {
        const workoutDate = localStorage.getItem("workoutDate");
        const updatedTables = [...exerciseTables];
        const tableToUpdate = updatedTables[tableIdx];
        const rowToDelete = tableToUpdate.rows[rowIdx];
    
        try {
            await fetchFromBackend(`${process.env.REACT_APP_API_URL}/delete-set`, "POST", {
                userID: user.id,
                id: rowToDelete.id,
                date: workoutDate, 
            });
    
            tableToUpdate.rows = tableToUpdate.rows.filter((_, idx) => idx !== rowIdx);

            let finalTables = updatedTables;
            if (tableToUpdate.rows.length === 0) {
                finalTables = updatedTables.filter((_, idx) => idx !== tableIdx);
            }

            setExerciseTables(finalTables);
            console.log("Set deleted successfully.");
        } catch (error) {
            alert(`Error deleting set: ${error.message}`);
        }
    };

    const fetchFromBackend = async (url, method, body) => {
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : null,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            if (response.headers.get("Content-Type")?.includes("application/json")) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error(`Error during ${method} request to ${url}:`, error.message);
            throw error;
        }
    };

    return (
        <div>
            <h1>{userName}'s Workout for {workoutDate}</h1>
            <UserButton
                appearance={{
                    elements: {
                        avatarBox: {
                            width: "40px",
                            height: "40px",
                        },
                    },
                }}
            />

            <button className="btn" onClick={() =>setRoutineModalOpen(true)}>
                Routine Recommender 
            </button>
            <button className="btn" onClick={() => setExerciseModalOpen(true)}>
                Add Exercise
            </button>

            {exerciseTables.map((table, idx) => (
                table.rows.length > 0 && (
                    <div key={idx} className="exercise-table-container">
                    <h2>{table.exercise}</h2>
                    <Table
                        rows={table.rows}
                        deleteRow={(rowIdx) => handleDeleteRow(idx, rowIdx)}
                        editRow={(rowIdx) => handleEditRow(idx, rowIdx)}
                    />
                    <button
                        className="btn"
                        onClick={() => {
                            setCurrentTableIdx(idx);
                            setModelOpen(true);
                        }}
                    >
                        Add Set
                    </button>
                    </div>
                )
            ))}

            {routineModalOpen && (
                <RoutineModal 
                    closeRoutineModal={() => setRoutineModalOpen(false)}
                    onRoutineSubmit={async (rawExercises) => {
                        console.log("Received parsed exercises:", rawExercises);

                        let exerciseArray = [];
            
            if (typeof rawExercises === 'string') {
                // Split by newline and use Regex to extract data
                const lines = rawExercises.split("\n");
                exerciseArray = lines
                    .map(line => {
                        const match = line.match(/exercise:(.*?), weight:(\d+), reps:(\d+)/i);
                        return match ? {
                            exercise: match[1].trim(),
                            weight: parseInt(match[2]),
                            reps: parseInt(match[3])
                        } : null;
                    })
                    .filter(ex => ex !== null); // Remove empty lines/non-matches
            } else {
                exerciseArray = rawExercises;
            }
            
                        const grouped = new Map();
                        exerciseArray.forEach((ex) => {
                            if (!grouped.has(ex.exercise)) {
                                grouped.set(ex.exercise, []);
                            }
                            grouped.get(ex.exercise).push({
                                weight: ex.weight,
                                reps: ex.reps,
                            });
                        });
            
                        const newTables = Array.from(grouped).map(([exercise, rows]) => ({
                            exercise,
                            rows,
                        }));
            
                        try {
                            const workoutDate = localStorage.getItem("workoutDate");
            
                            await fetchFromBackend(`${process.env.REACT_APP_API_URL}/save-routine`, "POST", {
                                userID: user.id,
                                date: workoutDate,
                                exercises: newTables,
                            });
            
                            alert("Routine saved to database!");
                            setExerciseTables((prev) => [...prev, ...newTables]);
                        } catch (err) {
                            console.error("Error saving routine:", err);
                            alert("Failed to save routine.");
                        }
                    }}
                />
            )}

            {exerciseModalOpen && (
                <SelectExercise
                    closeExerciseModal={() => setExerciseModalOpen(false)}
                    onExerciseSelect={(exercise) => {
                        handleAddExercise(exercise);
                        setExerciseModalOpen(false);
                    }}
                />
            )}
            
            {modelOpen && (
    <Modal
        closeModel={() => {
            setModelOpen(false);
            setRowToEdit(null);
            // Optional: If you want to delete the exercise table 
            // if they close the modal without adding a set, add logic here.
        }}
        onSubmit={rowToEdit !== null ? handleEditSet : handleAddSet}
        defaultValue={
            rowToEdit !== null && currentTableIdx !== null
            ? { 
                ...exerciseTables[currentTableIdx]?.rows[rowToEdit], 
                exercise: exerciseTables[currentTableIdx]?.exercise 
              }
            : { 
                // We use the index to find the name, even for the newly added one
                exercise: exerciseTables[currentTableIdx]?.exercise || "", 
                weight: "", 
                reps: "", 
                sets: "" 
            }
        }
        isEdit={rowToEdit !== null}
        date={workoutDate} 
    />
)}
        </div>
    );
}

export default WorkoutPage;