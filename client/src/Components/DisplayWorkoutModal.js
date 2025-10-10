import React, { useState } from "react";
import "./Modal.css";

function DisplayWorkoutModal({ closeDisplayWorkoutModel, onSubmit, defaultValue }) {
    const [formState, setFormState] = useState(
        defaultValue || {
            date: ""
        }
    );

    const [errors, setErrors] = useState("");

    const validateForm = () => {
        if (formState.date) {
            setErrors("");
            return true;
        } else {
            setErrors(`Please include a date`);
            return false;
        }
    };

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmitOne = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
    
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            const userId = user.userID;
    
            const response = await fetchFromBackend(`${process.env.REACT_APP_API_URL}/create-table`, "POST", {
                userId,
                date: formState.date,
            });
    
            if (response.message === "A workout already exists for this date.") {
                setErrors(response.message);
                return;
            }
    
            onSubmit({ date: formState.date });
            closeDisplayWorkoutModel();
        } catch (error) {
            console.error("Error creating workout table:", error);
            setErrors(error.message); // Display the error message from the backend
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
                const errorResponse = await response.json();
                throw new Error(errorResponse.message || "An error occurred.");
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
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container") closeDisplayWorkoutModel();
            }}
        >
            <div className="modal">
                <form>
                <h3>Exercise Modal: Select Date</h3>

                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        type="date"
                        name="date"
                        value={formState.date}
                        onChange={handleChange}
                    />
                </div>

                    {errors && <div className="error">{errors}</div>}
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                        <button
                            type="button"
                            className="btn"
                            onClick={handleSubmitOne}
                        >
                            Create
                        </button>
                        
                    </div>
                    
                </form>
            </div>
        </div>
    );
}

export default DisplayWorkoutModal;