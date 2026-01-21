import React from "react";
import './Header.css'
import DumbbellLogo from '../../assets/dumbell.png'
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

const Header = ({showHeaderMenu}) => {
    return (
        <div className="header">
            <div className="header-left">
                <img src={DumbbellLogo} alt="" className="dumbbellLogo" />
                <span className="logoText">FitTrack.AI</span>
            </div>
            
            {(showHeaderMenu) &&
                <ul className="headerMenu">
                    <SignedOut>
                        <li><ScrollLink to="hero" span={true} smooth={true}>Home</ScrollLink></li>
                        <li><ScrollLink to="Programs" span={true} smooth={true}>Programs</ScrollLink></li>
                        <li><ScrollLink to="Reasons" span={true} smooth={true}>Why Us</ScrollLink></li>
                    </SignedOut>
                    <SignedIn>
                        <li><RouterLink to="/" span={true} smooth={true}>Home</RouterLink></li>
                        <li><RouterLink to="/user" span={true} smooth={true}>My Diary</RouterLink></li>
                        <li><RouterLink span={true} smooth={true}>My Progress</RouterLink></li>
                    </SignedIn>
                </ul>
            }
        </div>
    )
}

export default Header;