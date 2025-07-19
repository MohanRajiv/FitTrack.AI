import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./SearchBar.css";

export const SearchBar = ({onInputChange, onSearchClick}) => {
    const [input, setInput] = useState("");

    const handleChange = (value) => {
        setInput(value);
        onInputChange(value);
    };

    const handleSearchClick = () => {
        onSearchClick(input);  
    };

    return (
        <div className="input-wrapper">
            <FaSearch id="search-icon" onClick={handleSearchClick} />
            <input
                placeholder="Type to search..."
                value={input}
                onChange={(e) => handleChange(e.target.value)}            
            />
        </div>
    );
};