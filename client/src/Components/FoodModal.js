import React, { useState, useEffect} from "react";
import "./Modal.css";

function SelectFood({closeFoodModal, onSubmit, defaultValue, isEdit, inSearch, extractedText, foodList}) {
    console.log("Modal opened with defaultValue:", defaultValue);
    
    const [formState, setFormState] = useState(
        (inSearch && extractedText && extractedText.length > 0)
            ? {
                meal: "",
                servings: "",
                ...arrayToFormState(extractedText),
            }
            : (defaultValue || {
                meal: "",
                name: "",
                protein: "",
                carbs: "",
                fats: "",
                calories: "",
                servings: "",
            })
    );

    function arrayToFormState(arr) {
        const allowedKeys = ["name", "protein", "carbs", "fats", "calories"];
        const obj = {};
        for (let i = 0; i < arr.length - 1; i += 2) {
            const key = arr[i].toLowerCase();
            if (allowedKeys.includes(key)) {
                obj[key] = arr[i + 1];
            }
        }
        return obj;
    }

    useEffect(() => {
        if (inSearch && extractedText && extractedText.length > 0) {
            setFormState({
                meal: defaultValue?.meal || "",   // 👈 keep the defaultValue if available
                servings: "",
                ...arrayToFormState(extractedText),
            });
        } else if (defaultValue) {
            setFormState(defaultValue);
        } else {
            setFormState({
                meal: "",
                name: "",
                protein: "",
                carbs: "",
                fats: "",
                calories: "",
                servings: "",
            });
        }
        setErrors(""); 
    }, [defaultValue, inSearch, extractedText]);

    const [errors, setErrors] = useState(null); 

    const validateForm = () => {
        const requiredFields = ['name', 'protein', 'carbs', 'fats', 'calories'];
        if (!isEdit){
            requiredFields.push('servings');
            requiredFields.push('meal');
        }

        const missingFields = requiredFields.filter(field => {
            const value = formState[field];
            return value === "" || value === null || value === undefined;
        });
    
        if (missingFields.length > 0) {
            setErrors(missingFields.join(", "));
            return false;
        }
    
        setErrors("");
        return true;
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
    
        const servings = parseFloat(formState.servings) || 1;

        const adjustedFormState = {
            ...formState,
            protein: (parseFloat(formState.protein) * servings).toString(),
            carbs: (parseFloat(formState.carbs) * servings).toString(),
            fats: (parseFloat(formState.fats) * servings).toString(),
            calories: (parseFloat(formState.calories) * servings).toString(),
        };

        onSubmit(adjustedFormState);
        
        closeFoodModal();
    };

    return (
        <div
            className="modal-container"
            onClick={(e) => {
                if (e.target.className === "modal-container") closeFoodModal();
            }}
        >
            <div className="modal">
                <form>
                    <h3>Select Food</h3>
                    {isEdit === false && <div className="form-group">
                        <label htmlFor="mealSelect">Select Meal:</label>
                            <select
                                name="meal"
                                value={formState.meal}
                                onChange={handleChange}
                            >
                            <option value="" disabled>
                                -- Select an meal --
                            </option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                        </select>
                    </div>}
                    {(!inSearch && !isEdit) && <div className="form-group">
                        <label htmlFor="foodSelect">Choose Food:</label>
                        <select
                            name="foodSelect"
                            onChange={(e) => {
                            const selected = foodList.find(food => food.foodName === e.target.value);
                            if (selected) {
                                setFormState(prev => ({
                                    ...prev,
                                    name: selected.foodName,   // 👈 map foodName → name for formState
                                    protein: selected.protein,
                                    carbs: selected.carbs,
                                    fats: selected.fats,
                                    calories: selected.calories,
                                }));
                            }
                            }}
                            defaultValue=""
                        >
    <option value="" disabled>Select a food</option>
    {foodList.map(food => (
        <option key={food.id} value={food.foodName}>
            {food.foodName}
        </option>
    ))}
</select>

                    </div>}
                    {(inSearch || isEdit) && <div className="form-group">
                        <label htmlFor="name">Name:</label>
                            <input
                                name="name"
                                value={formState.name}
                                onChange={handleChange}
                                readOnly
                            />
                    </div>}
                    <div className="form-group">
                        <label htmlFor="protein">Protein:</label>
                            <input
                                name="protein"
                                value={formState.protein}
                                onChange={handleChange}
                                readOnly
                            />
                        </div>
                    <div className="form-group">
                        <label htmlFor="fats">Fats:</label>
                            <input
                                name="fats"
                                value={formState.fats}
                                onChange={handleChange}
                                readOnly
                            />
                    </div>
                    <div className="form-group">
                        <label htmlFor="carbs">Carbs:</label>
                            <input
                                name="carbs"
                                value={formState.carbs}
                                onChange={handleChange}
                                readOnly
                            />
                    </div>
                    <div className="form-group">
                        <label htmlFor="calories">Calories:</label>
                            <input
                                name="calories"
                                value={formState.calories}
                                onChange={handleChange}
                                readOnly
                            />  
                    </div>
                    <div className="form-group">
                        <label htmlFor="Servings">Servings:</label>
                            <input
                                type = "number"
                                name="servings"
                                value={formState.servings}
                                onChange={handleChange}
                            />
                    </div>
                    {errors && <div className="error">{`Please fill out all categories`}</div>}
                    <button type="submit" className="btn" onClick={handleSubmit}>
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SelectFood;