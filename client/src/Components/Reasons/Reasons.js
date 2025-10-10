import React, {useState} from "react";
import './Reasons.css'
import { reasonsData } from "../../data/reasonsData";
import leftArrow from '../../assets/leftArrow.png'
import rightArrow from '../../assets/rightArrow.png'
import {motion} from 'framer-motion';

const Reasons = () => {
    const [selected, setSelected] = useState(0);
    const tLength = reasonsData.length;
    const transition = {type: "spring", duration: 1};
    return (
        <div className="Reasons">
            <div className="blur plans-blur-1"></div>

            <div className="left-t">
                <div className="headline-row">
                    <span className="stroke-text-two">Why</span>
                     <span>Choose Us?</span>
                </div>
                <span>Some reasons</span>
                <motion.span
                    key={selected}
                    initial = {{opacity:0, x:-100}}
                    animate = {{opacity:1, x:0}}
                    exit={{opacity:0, x:100}}
                    transition={transition}
                >
                    {reasonsData[selected].review}
                </motion.span>
                <div className="reasons-footer "></div>
            </div>
            <div className="right-t">
                <div className="image-border"></div>
                <div className="plan-card-border"></div>
                <motion.img 
                key={selected}
                initial = {{opacity: 0, x:100}}
                animate = {{opacity:1, x: 0}}
                exit={{opacity: 0, x:-100}}
                transition={transition}
                src = {reasonsData[selected].image} alt = ""
                />
                <div className="arrows">
                    <img 
                        onClick = {()=> {
                            selected===0?setSelected(tLength-1):
                            setSelected((prev)=> prev-1)
                        }}
                        src={leftArrow} 
                        alt="" 
                    />
                    <img 
                        onClick={() => {
                            selected===tLength -1 
                                ? setSelected(0) 
                                : setSelected((prev) => prev + 1);
                        }}  
                        src={rightArrow} 
                        alt=""
                    />
                </div>
            </div>
        </div>
    )
}

export default Reasons;