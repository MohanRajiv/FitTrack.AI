import React, { useState } from "react";
 
function Modal({ closeModel, onSubmit, defaultValue, isEdit, date }) {
    const [formState, setFormState] = useState(
        defaultValue || {
            weight: "",
            reps: "",
            sets: "",
        }
    );

    const [errors, setErrors] = useState("");

    const validateForm = () => {
        if (formState.weight && formState.reps) {
            if (isEdit === false && !formState.sets) return false; // Validate `sets` only in Add mode
            setErrors("");
            return true;
        } else {
            let errorFields = [];
            for (const [key, value] of Object.entries(formState)) {
                if (!value) {
                    errorFields.push(key);
                }
            }
            setErrors(errorFields.join(", "));
            return false;
        }
    };

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        onSubmit({
            ...formState,
            date, 
        });
        closeModel();
    };

    return (
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container") closeModel();
            }}
        >
            <div className="modal">
                <form>
                    <div className="form-group">
                        <label htmlFor="weight">Weight</label>
                        <input
                            name="weight"
                            value={formState.weight}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="reps">Reps</label>
                        <input
                            name="reps"
                            value={formState.reps}
                            onChange={handleChange}
                        />
                    </div>
                    {isEdit === false && (
                        <div className="form-group">
                            <label htmlFor="sets">Sets</label>
                            <input
                                name="sets"
                                type="number"
                                min="1"
                                value={formState.sets}
                                onChange={handleChange}
                            />
                        </div>
                    )}
                    {errors && <div className="error">{`Please include: ${errors}`}</div>}
                    <button
                        type="button"
                        className="btn"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Modal;