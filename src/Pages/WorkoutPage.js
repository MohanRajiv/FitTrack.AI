import "./App.css";
import React, { useState, useEffect } from "react";
import Table from "../Components/TableComponents/Table";
import Modal from "../Components/Modal";
import SelectExercise from "../Components/ExerciseModal";

function WorkoutPage(){
    const [modelOpen, setModelOpen] = useState(false);
    const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [exerciseTables, setExerciseTables] = useState([]);
    const [rowToEdit, setRowToEdit] = useState(null);
    const [currentTableIdx, setCurrentTableIdx] = useState(null);
    const [workoutDate, setWorkoutDate] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        const workoutDate = localStorage.getItem("workoutDate");

        if (user) {
            setUserName(user.name);
            setWorkoutDate(workoutDate);
    
            const fetchExercises = async () => {
                try {
                    const response = await fetchFromBackend("http://localhost:3001/get-exercises", "POST", {
                        userID: user.userID,
                        date: workoutDate
                    });
    
                    if (response.exercises && response.exercises.length > 0) {
                        const exercisesMap = new Map();
                        response.exercises.forEach((row) => {
                            if (!exercisesMap.has(row.exercise)) {
                                exercisesMap.set(row.exercise, []);
                            }
                            exercisesMap.get(row.exercise).push(row);
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
    }, []);

    const handleAddExercise = async (exercise) => {
        if (!exercise) {
            alert("Please select an exercise before adding.");
            return;
        }
        
        try {
            const newTable = { exercise, rows: [] };
            setExerciseTables([...exerciseTables, newTable]);
            alert("Exercise added successfully");
        } catch (error) {
            alert(`Failed to add exercise: ${error.message}`);
        }
    };

    const handleAddSet = async (newRow) => {
        console.log("newRow in handleAddSet:", newRow); // Debugging line
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user.userID;
        const workoutDate = localStorage.getItem("workoutDate");
    
        if (currentTableIdx !== null) {
            const updatedTables = [...exerciseTables];
            const tableToUpdate = updatedTables[currentTableIdx];
    
            const setsCount = parseInt(newRow.sets, 10);
            const newRows = [];
    
            for (let i = 1; i <= setsCount; i++) {
                const set = { ...newRow, setNumber: i };
                try {
                    const data = await fetchFromBackend("http://localhost:3001/add-set", "POST", {
                        userId,
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
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user.userID;
        const workoutDate = localStorage.getItem("workoutDate");
    
        if (currentTableIdx !== null) {
            const updatedTables = [...exerciseTables];
            const tableToUpdate = updatedTables[currentTableIdx];
            const rowToUpdate = tableToUpdate.rows[rowToEdit];
    
            rowToUpdate.weight = updatedRow.weight;
            rowToUpdate.reps = updatedRow.reps;
            rowToUpdate.sets = updatedRow.sets;
    
            try {
                await fetchFromBackend("http://localhost:3001/edit-set", "POST", {
                    userID: userId,
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
        const user = JSON.parse(localStorage.getItem("user"));
        const userID = user.userID;
        const workoutDate = localStorage.getItem("workoutDate");
    
        const updatedTables = [...exerciseTables];
        const tableToUpdate = updatedTables[tableIdx];
        const rowToDelete = tableToUpdate.rows[rowIdx];
    
        try {
            await fetchFromBackend("http://localhost:3001/delete-set", "POST", {
                userID,
                id: rowToDelete.id,
                date: workoutDate, 
            });
    
            tableToUpdate.rows = tableToUpdate.rows.filter((_, idx) => idx !== rowIdx);
            setExerciseTables(updatedTables);
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
            
            <button className="btn">
                Routine Recommender 
            </button>

            {exerciseTables.map((table, idx) => (
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
            ))}
            <button className="btn" onClick={() => setExerciseModalOpen(true)}>
                Add Exercise
            </button>
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
        }}
        onSubmit={rowToEdit !== null ? handleEditSet : handleAddSet}
        defaultValue={
            rowToEdit !== null && currentTableIdx !== null
                ? exerciseTables[currentTableIdx].rows[rowToEdit]
                : { weight: "", reps: "", sets: "" }
        }
        isEdit={rowToEdit !== null}
        date={workoutDate} // Pass the date to Modal
    />
    )}
        </div>
    );
}

export default WorkoutPage;