import "./App.css";
import React, { useState, useEffect } from "react";
import SelectFood from "../Components/FoodModal";
import CalorieTable from "../Components/TableComponents/CalorieTable";
import SearchModal from "../Components/SearchModal";
import MealPlanModal from "../Components/MealPlanModal";

function FoodDiary() {
  const [foodTables, setFoodTables] = useState([]);
  const [foodList, setFoodList] = useState([]);
  const [userName, setUserName] = useState("");
  const [date, setDate] = useState(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mealPlanModalOpen, setMealPlanModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState(null);

  const fetchFoods = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const date = localStorage.getItem("trackerDate");
    try {
        const response = await fetchFromBackend("http://localhost:3001/get-logs", "POST", {
            userID: user.userID,
            date
        });
  
        console.log("Backend response from /get-logs:", response);
  
        if (response.foods && response.foods.length > 0) {
            const mealMap = new Map();
            response.foods.forEach((row) => {
                if (!mealMap.has(row.meal)) {
                  mealMap.set(row.meal, []);
                }
                mealMap.get(row.meal).push(row);
            });
  
            const tables = Array.from(mealMap).map(([meal, rows]) => ({
                meal,
                rows,
            }));
  
            setFoodTables(tables);
        } else {
            setFoodTables([]);
        }
    } catch (error) {
      console.error("Error fetching foods:", error);
    }
  }

  const fetchFoodList = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
    try {
        const response = await fetchFromBackend("http://localhost:3001/get-food-list", "POST", {
            userID: user.userID
        });
        setFoodList(response.foodList || []);
        console.log("Fetched food list:", response.foodList);
    } catch (error) {
        console.error("Error fetching food list:", error);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const date = localStorage.getItem("trackerDate");

    if (user) {
      setUserName(user.name);
      setDate(date); 
      fetchFoods();
      fetchFoodList();
    }
  }, []);

  const handleEditRow = (meal, rowIdx) => {
    const mealTable = foodTables.find(t => t.meal === meal);
    const row = mealTable.rows[rowIdx];
    console.log(row)
    setRowToEdit({
      ...row,
      name: row.foodName || row.name || "",
    });    
    setFoodModalOpen(true);
  };

  const handleDeleteRow = async (meal, rowIdx) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const date = localStorage.getItem("trackerDate");

    const mealTable = foodTables.find(t => t.meal === meal);
    const row = mealTable.rows[rowIdx];

    try {
      await fetchFromBackend("http://localhost:3001/delete-food", "POST", {
        userID: user.userID,
        id: row.id,    
        date: date
      });
      await fetchFoods(); 
    } catch (error) {
      alert("Failed to delete food: " + error.message);
    }
  };

  const handleSubmit = async (newRow) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user.userID;
    const date = localStorage.getItem("trackerDate");

    if (rowToEdit === null) {
      const variables = {
        userId: userId,
        meal: newRow.meal,           
        foodName: newRow.name,  
        protein: newRow.protein,
        fats: newRow.fats,
        carbs: newRow.carbs,
        calories: newRow.calories,
        date,
      };

      try {
        await fetchFromBackend("http://localhost:3001/add-food", "POST", variables);
        await fetchFoods();
      } catch (error) {
        alert("Failed to add food: " + error.message);
      }
    } else {
      const variables = {
        userID: userId,
        id: rowToEdit.id,
        protein: newRow.protein,
        fats: newRow.fats,
        carbs: newRow.carbs,
        calories: newRow.calories,
        date,
      };
  
      try {
        await fetchFromBackend("http://localhost:3001/edit-food", "POST", variables);
        await fetchFoods();
        setRowToEdit(null);
      } catch (error) {
        alert("Failed to edit food: " + error.message);
      }
    }
  };

  const handleMealPlanSubmit = async (meals) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const date = localStorage.getItem("trackerDate");
    if (!user || !date) return;
  
    try {
      for (const meal of meals) {
        await fetchFromBackend("http://localhost:3001/add-food", "POST", {
          userId: user.userID,
          meal: meal.section,        
          foodName: meal.food,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          date,
        });
      }
  
      await fetchFoods();
    } catch (error) {
      console.error("Failed to save meal plan:", error);
      alert("Something went wrong adding the meal plan.");
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

  const updateAmounts = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    for (let meal of foodTables) {
      for (let row of meal.rows) {
        totalCalories += parseFloat(row.calories) || 0;
        totalProtein += parseFloat(row.protein) || 0;
        totalCarbs += parseFloat(row.carbs) || 0;
        totalFats += parseFloat(row.fats) || 0;
      }
    }
    return {totalCalories, totalProtein, totalCarbs, totalFats};
  };

  return (
    <div>
      <h1>{userName}'s Calorie Tracker for {date}</h1>
      <h2>Calories: {updateAmounts(foodTables).totalCalories.toFixed(1)}</h2>
      <h3>Protein: {updateAmounts(foodTables).totalProtein.toFixed(1)}g</h3>
      <h3>Carbs: {updateAmounts(foodTables).totalCarbs.toFixed(1)}g</h3>
      <h3>Fat: {updateAmounts(foodTables).totalFats.toFixed(1)}g</h3>

      <button className="btn" onClick={() => setSearchModalOpen(true)} >
        Search Food
      </button>
      
      <button className="btn" onClick={() => setFoodModalOpen(true)}>
        Add Food
      </button>

      <button className="btn" onClick={() => setMealPlanModalOpen(true)}>
        Meal Plan Generator
      </button>

      {foodTables.some(row => row.meal === "Breakfast") && (
        <>
          <h2>Breakfast</h2>
          <CalorieTable
            rows={foodTables.find(t => t.meal === "Breakfast")?.rows || []}
            deleteRow={(rowIdx) => handleDeleteRow("Breakfast", rowIdx)}
            editRow={(rowIdx) => handleEditRow("Breakfast", rowIdx)}
            />
        </>
      )}

      {foodTables.some(row => row.meal === "Lunch") && (
        <>
          <h2>Lunch</h2>
          <CalorieTable
            rows={foodTables.find(t => t.meal === "Lunch")?.rows || []}
            deleteRow={(rowIdx) => handleDeleteRow("Lunch", rowIdx)}
            editRow={(rowIdx) => handleEditRow("Lunch", rowIdx)}
            />
        </>
      )}

      {foodTables.some(row => row.meal === "Dinner") && (
        <>
          <h2>Dinner</h2>
          <CalorieTable
            rows={foodTables.find(t => t.meal === "Dinner")?.rows || []}
            deleteRow={(rowIdx) => handleDeleteRow("Dinner", rowIdx)}
            editRow={(rowIdx) => handleEditRow("Dinner", rowIdx)}
            />
        </>
      )}

      {mealPlanModalOpen && (
        <MealPlanModal
          closeMealPlanModal ={() => {
            setMealPlanModalOpen(false);
          }}
          onMealPlanSubmit={handleMealPlanSubmit}
        />
      )}

      {searchModalOpen && (
        <SearchModal
          closeSearchModal ={() => {
            setSearchModalOpen(false);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {foodModalOpen && (
        <SelectFood
          closeFoodModal={() => {
            setFoodModalOpen(false);
            setRowToEdit(null);
          }}
          onSubmit={handleSubmit}
          defaultValue={rowToEdit}
          isEdit={rowToEdit !== null}
          foodList={foodList}
        />
      )}
    </div>
  );
}

export default FoodDiary;
