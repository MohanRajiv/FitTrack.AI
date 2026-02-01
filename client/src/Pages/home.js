import Hero from "../Components/HeroComponent/Hero";
import Programs from "../Components/Programs/Programs";
import Reasons from "../Components/Reasons/Reasons";
import Footer from "../Components/Footer/Footer";
import {SignedOut} from "@clerk/clerk-react";
import {useEffect} from "react";

function Home() {
  useEffect(() => {  
    createWorkoutTable();
    createNutritionLog();
    createFoodList();
  }, []);

  const createWorkoutTable = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/create-workout-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error fetching user logs:", err);
    }
  };

  const createNutritionLog = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/create-nutrition-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error fetching user logs:", err);
    }
  };

  const createFoodList = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/create-food-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error fetching user logs:", err);
    }
  };

  return (
    <div className="App">
      <Hero/>
      <SignedOut>
        <Programs/>
        <Reasons/>
      </SignedOut>
      <Footer/>
    </div>
  );
}

export default Home;