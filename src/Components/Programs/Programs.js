import React from "react";
import './Programs.css';
import { programsData } from "../../data/programsData";

const Programs = () => {
    return (
        <div className="Programs" id="programs"> 
            <div className="programs-header">
                <span className="stroke-text-two">Explore our</span>
                <span> Features</span>
                <span className="stroke-text-two"> to shape you</span>
            </div>

            <div className="program-categories">
            {programsData.map((program) => (
                <div className="category">
                    {program.image}
                    <span >{program.heading}</span>
                    <span>{program.details}</span>
                </div>
            ))}
            </div>
        </div>
    );
}

export default Programs;