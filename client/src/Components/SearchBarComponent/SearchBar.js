import { useState } from "react";
import { FaSearch, FaCamera, FaTimes } from "react-icons/fa"; // import FaTimes
import "./SearchBar.css";

export const SearchBar = ({
  showComponents,
  onInputChange,
  onSearchClick,
  onFileChange,
  accept,
  imagePreview,
  onClearImage // new prop
}) => {
  const [input, setInput] = useState("");

  const handleChange = (value) => {
    setInput(value);
    onInputChange(value);
  };

  const handleSearchClick = () => {
    onSearchClick(input);
  };

  return (
    <div className={`input-wrapper ${imagePreview ? "has-image" : ""}`}>
      {showComponents && imagePreview && (
        <div className="image-preview-wrapper">
          <img
            src={imagePreview}
            alt="Preview"
            className="search-img-preview"
          />
          <button
            type="button"
            className="clear-image-btn"
            onClick={onClearImage}
            aria-label="Clear image"
          >
            <FaTimes />
          </button>
        </div>
      )}
      <div className="search-controls">
        <input
          placeholder="Type to search..."
          value={input}
          onChange={(e) => handleChange(e.target.value)}
        />
        {showComponents && (
          <label className="file-label">
            <input
              type="file"
              onChange={onFileChange}
              accept={accept || "image/*"}
              style={{ display: "none" }}
            />
            <span className="file-select-btn">
              <FaCamera />
            </span>
          </label>
        )}
        
        <FaSearch id="search-icon" onClick={handleSearchClick} />
      </div>
    </div>
  );
};
