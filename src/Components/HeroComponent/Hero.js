import React from "react";
import './Hero.css';
import Header from "../Header/Header";
import HeroImage from '../../assets/hero_image.png'
import HeroImageBack from '../../assets/hero_image_back.png'
import Calories from '../../assets/calories.png'
import DumbbellImage from '../../assets/dumbell.png'
import { ReactComponent as FlameIcon } from '../../assets/flame.svg';
import { useState } from "react";
import { Link} from 'react-router-dom';
import {motion} from 'framer-motion';

const Hero = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setDropdownVisible(prev => !prev);
    };

    const transition = {type: 'spring', duration: 2.5}
    const transitionTwo = {type: 'spring', duration: 3.5}

    return (
        <div className="hero">
            <div className="blur hero-blur"></div>
            <div className="blur hero-blur-two"></div>

            <div className = "left-h">
                <Header
                    showHeaderMenu={true}
                />
                <div className="the-best-tracker">
                    <motion.div
                    initial = {{left: '650px'}}
                    whileInView = {{left: '8px'}}
                    transition={{...transition, type: 'tween'}}
                    >

                    </motion.div>
                    <span className="orbitronFront">Combining Fitness and Diet Tracking with Artificial Intelligence</span>
                </div>

                <div className = "hero-text">
                    <span className="stroke-text">Revolutionize</span>
                </div>
                
                <div className="hero-text-two">
                    <span> Your Fitness Tracking</span>
                </div>
                <div>
                    <span className="hero-text-three">Track your daily workouts and calorie intake using state of the art AI assistance</span>
                </div>
            </div>
            <div className = "right-h">
                <button className="btn-two" onClick={toggleDropdown}>Account</button>   
                {dropdownVisible && (
                    <div className="dropdown-menu">
                        <Link to="/login" className="dropdown-item">Login </Link>
                        <Link to="/register" className="dropdown-item">Register </Link>    
                    </div>
                )}

                <img src = {HeroImage} alt="" className="hero-image"/> 
                <motion.img 
                initial ={{right: "-33rem"}}
                whileInView={{right: "-23.5rem"}}
                transition={transitionTwo}
                src = {HeroImageBack} alt="" className="hero-image-back"
                /> 

                <motion.div 
                initial ={{right: "45rem"}}
                whileInView={{left: "-52.5rem"}}
                transition={transitionTwo}
                className="foodsCard"
                >
                    <FlameIcon className="flameImage" />
                    <div>
                        <span className="orbitronFrontTwo">100,000</span>
                        <span className="orbitronFrontTwo">Customized Diet Plans</span>
                    </div>

                </motion.div>
                
                <motion.div
                initial={{ y: 100}}    
                whileInView={{ y: 0}}   
                transition={transitionTwo}
                className="calories"
                >
                    <img src={Calories} alt="" className="caloriesImage" />
                    <div>
                        <span className="orbitronFrontTwo">Calories Tracked</span>
                        <span className="orbitronFrontTwo">2500 Cal</span>
                    </div>
                </motion.div>

                <motion.div 
                initial={{ right: "2.5rem" }}            // Start far right (off screen)
                whileInView={{ right: "10rem" }}          // Slide into place (fully visible)
                transition={transitionTwo}
                className="workouts"
                >
                    <img src ={DumbbellImage} alt ="" className="dumbbellImage"/>
                    <div>
                        <span className="orbitronFrontTwo">250</span>
                        <span className="orbitronFrontTwo">Workouts Generated</span>
                    </div>
                </motion.div>

            </div>
        </div>
    )
}

export default Hero;