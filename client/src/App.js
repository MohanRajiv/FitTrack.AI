import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Home from "./Pages/home";
import UserPage from "./Pages/UserPage/UserPage";
import WorkoutPage from "./Pages/WorkoutPage";
import FoodDiary from "./Pages/FoodDiaryPage";

export function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/user"
          element={
            <>
              <SignedIn>
                <UserPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route
          path="/WorkoutPage"
          element={
            <>
              <SignedIn>
                <WorkoutPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn signInForceRedirectUrl="/user" />              </SignedOut>
            </>
          }
        />

        <Route
          path="/FoodDiaryPage"
          element={
            <>
              <SignedIn>
                <FoodDiary />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn signInForceRedirectUrl="/user" />              
              </SignedOut>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
