import React, { useState, useEffect } from "react";
import DisplayWorkoutModal from "../../Components/DisplayWorkoutModal";
import FoodDiaryModal from "../../Components/FoodDiaryModal";
import {useNavigate} from "react-router-dom";
import Header from "../../Components/Header/Header";

function UserPage() {
    const [userName, setUserName] = useState("");
    const [displayWorkoutModalOpen, setDisplayWorkoutModalOpen] = useState(false);
    const [foodDiaryModalOpen, setfoodDiaryModalOpen] = useState(false);
    const navigate = useNavigate()

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            setUserName(user.name);
        }
    }, []);

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
            </div>
        </div>
    );
}

export default UserPage;