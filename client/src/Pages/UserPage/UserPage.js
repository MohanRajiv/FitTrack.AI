import React, { useState, useEffect } from "react";
import DisplayWorkoutModal from "../../Components/DisplayWorkoutModal";
import FoodDiaryModal from "../../Components/FoodDiaryModal";
import {useNavigate} from "react-router-dom";
import "react-calendar/dist/Calendar.css";
import Header from "../../Components/Header/Header";
import Calendar from "react-calendar";

function UserPage() {
    const [userName, setUserName] = useState("");
    const [displayWorkoutModalOpen, setDisplayWorkoutModalOpen] = useState(false);
    const [foodDiaryModalOpen, setfoodDiaryModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const navigate = useNavigate()
    const [workoutDates, setWorkoutDates] = useState([]);
    const [foodDates, setFoodDates] = useState([]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            setUserName(user.name);
            fetchUserLogs(user.userID);
        }
    }, []);

    const fetchUserLogs = async (userId) => {
        try {
          const response = await fetch("http://localhost:3001/get-user-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID: userId }),
          });
      
          const data = await response.json();
          console.log("Fetched workoutDates:", data.workoutDates);
          console.log("Fetched foodDates:", data.foodDates);
          setWorkoutDates(data.workoutDates || []);
          setFoodDates(data.foodDates || []);
        } catch (err) {
          console.error("Error fetching user logs:", err);
        }
      };
      

    const handleDisplayWorkout = async (formState) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user.userID;
            
        const date = `${formState.date}`; 
        console.log("Date in handleCreateWorkout:", date); 
    
        localStorage.setItem("workoutDate", date);
        navigate('/WorkoutPage'); 
    }

    const handleDisplayFoodDiary = async (formState) => {
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user.userID;

        const date = `${formState.date}`; 
        console.log("Date in handleDisplayFoodDiary:", date);
        
        localStorage.setItem("trackerDate", date);
        navigate('/FoodDiaryPage'); 
    };

    const handleDateClick = (date) => {
        const formattedDate = date.toISOString().split("T")[0];
        console.log(formattedDate);
    };

    return (
        <div className="App">
            <div className="userPage">
                <div className="left-h">
                    <Header
                        showHeaderMenu={false}
                    />  
                </div>
                <h1>Welcome, {userName}!</h1>
                <button className="btn" onClick={() => setDisplayWorkoutModalOpen(true)}>
                    Workout Log
                </button>    
                {displayWorkoutModalOpen && (
                <DisplayWorkoutModal
                    closeDisplayWorkoutModel={() => {
                        setDisplayWorkoutModalOpen(false);
                    }}
                    onSubmit={handleDisplayWorkout}
                />
                )}
                <button className="btn" onClick={() => setfoodDiaryModalOpen(true)}>
                    Calorie Tracker
                </button>
                {foodDiaryModalOpen && (
                <FoodDiaryModal
                    closeFoodDiaryModal={() => {
                        setfoodDiaryModalOpen(false);
                    }}
                    onSubmit={handleDisplayFoodDiary}
                />
                )}
                <div className="calendar-container">
                    <h2>Select a Date to View or Add Workouts</h2>
                    <Calendar
  onClickDay={handleDateClick}
  tileContent={({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const hasWorkout = workoutDates.includes(dateStr);
      const hasFood = foodDates.includes(dateStr);

      return (
        <div style={{ fontSize: "16px", marginTop: "4px", display: "flex", gap: "4px", justifyContent: "center" }}>
          {hasWorkout && (
            <span
              onClick={(e) => {
                e.stopPropagation(); // prevent onClickDay from firing
                localStorage.setItem("workoutDate", dateStr);
                navigate("/WorkoutPage");
              }}
              style={{
                cursor: "pointer",
                padding: "2px",
                borderRadius: "4px",
                background: "#e0f7fa",
              }}
              title="View Workout Log"
            >
              🏋️‍♂️
            </span>
          )}
          {hasFood && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem("trackerDate", dateStr);
                navigate("/FoodDiaryPage");
              }}
              style={{
                cursor: "pointer",
                padding: "2px",
                borderRadius: "4px",
                background: "#ffe0b2",
              }}
              title="View Food Log"
            >
              🍎
            </span>
          )}
        </div>
      );
    }
  }}
/>

                </div>
            </div>
        </div>
    );
}

export default UserPage;