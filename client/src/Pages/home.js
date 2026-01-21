import Hero from "../Components/HeroComponent/Hero";
import Programs from "../Components/Programs/Programs";
import Reasons from "../Components/Reasons/Reasons";
import Footer from "../Components/Footer/Footer";
import {SignedOut} from "@clerk/clerk-react";

function Home() {
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