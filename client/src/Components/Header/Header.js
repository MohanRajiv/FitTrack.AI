import React from "react";
import './Header.css'
import DumbbellLogo from '../../assets/dumbell.png'
import { Link } from "react-scroll";

const Header = ({showHeaderMenu}) => {

    return (
        <div className="header">
            <div className="header-left">
                <img src={DumbbellLogo} alt="" className="dumbbellLogo" />
                <span className="logoText">FitTrack.AI</span>
            </div>
            {(showHeaderMenu) &&
                <ul className="headerMenu">
                <li><Link to="hero" span={true} smooth={true}>Home</Link></li>
                <li><Link to="Programs" span={true} smooth={true}>Programs</Link></li>
                <li><Link to="Reasons" span={true} smooth={true}>Why Us</Link></li>
                </ul>
            }
        </div>
    )
}

export default Header;