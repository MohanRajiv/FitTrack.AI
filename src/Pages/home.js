import Hero from "../Components/HeroComponent/Hero";
import Programs from "../Components/Programs/Programs";
import Reasons from "../Components/Reasons/Reasons";
import Footer from "../Components/Footer/Footer";

function Home() {
  return (
    <div className="App">
      <Hero/>
      <Programs/>
      <Reasons/>
      <Footer/>
    </div>
  );
}

export default Home;