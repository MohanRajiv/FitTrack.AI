import React from 'react'
import './Footer.css'
import Github from "../../assets/github.png";
import LinkedIn from "../../assets/linkedin.png";
import Logo from "../../assets/logo.png";
import DumbbellLogo from '../../assets/dumbell.png'

const Footer = () => {
    return (
        <div>
            <div className='Join'>
                <div>
                    <div className='join-us-footer'></div>
                        <span className='stroke-text-two'>READY TO</span>
                        <span> LEVEL UP</span>
                        <span className='stroke-text-two'> WITH US?</span>
                </div>
            </div>
            <div className='Footer-Container'>
                <hr />
                <div className='footer'>
                    <div className='social-links'>
                        <a href="https://github.com/MohanRajiv" target="_blank" rel="noopener noreferrer">
                            <img src={Github} alt="GitHub" />
                        </a>
                        <a href="https://www.linkedin.com/in/rajiv-mohan-1b5a912a0/" target="_blank" rel="noopener noreferrer">
                            <img src={LinkedIn} alt="LinkedIn" />
                        </a>
                    </div>
                    <div className='logo-f'>
                        <img src={DumbbellLogo} alt="" className="dumbbellLogoFooter" />
                        <span className="logoTextFooter">FitTrack.AI</span>
                    </div>
                </div>
                <div className="blur blur-f-1"></div>
                <div className="blur blur-f-2"></div>
            </div>
        </div>
    )
}

export default Footer;