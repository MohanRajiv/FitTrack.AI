import { Routes, Route} from "react-router-dom";
import Home  from "./Pages/home";
import Register from "./Pages/RegisterPage/RegisterPage";
import Login from "./Pages/LoginPage/LoginPage";
import UserPage from "./Pages/UserPage/UserPage";
import WorkoutPage from "./Pages/WorkoutPage";
import FoodDiary from "./Pages/FoodDiaryPage";
 

export function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/WorkoutPage" element={<WorkoutPage />} />
        <Route path="/FoodDiaryPage" element={<FoodDiary />} />
      </Routes>
    </div>
  );
}

export default App;
