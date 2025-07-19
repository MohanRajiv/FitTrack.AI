import React, { useState } from "react";
import "./Modal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";
import SelectFood from "./FoodModal";

function SearchModal({ closeSearchModal, onSubmit, defaultValue, addFoodToList }) {
  const [errors, setErrors] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResponse, setSearchResponse] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // 👈 Added
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState(null);
  const [extractedText, setExtractedText] = useState([]);

  const handleSubmit = (newRow) => {
    onSubmit(newRow);
    closeSearchModal();
  };

  const addToList = () => {
    const foodObj = {};
    for (let i = 0; i < extractedText.length - 1; i += 2) {
      foodObj[extractedText[i].toLowerCase()] = extractedText[i + 1];
    }
    if (foodObj.name) {
      addFoodToList(foodObj);
      alert("Food added to list!");
    }
  };

  const handleInputChange = (value) => {
    setSearchInput(value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSearchClick = async (inputValue) => {
    setSearchInput(inputValue);

    const formData = new FormData();
    formData.append("message", inputValue);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const res = await axios.post("http://localhost:3001/get-gemini-text", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSearchResponse(res.data.reply);
      const colonSplit = res.data.reply.split(":");
      const commaSplit = colonSplit.flatMap((part) => part.split(","));
      setExtractedText(commaSplit.map((str) => str.trim()));
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setSearchResponse("Error fetching Gemini response.");
    }
  };

  return (
    <div
      className="modal-container"
      onClick={(e) => {
        if (e.target.className === "modal-container") closeSearchModal();
      }}
    >
      <div className="modal">
        <h3>Search for Food Nutrition Info</h3>

        <div className="search-bar-container">
          <input type="file" onChange={handleImageChange} accept="image/*" />
          {imagePreview && (
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
              />
            </div>
          )}
          <SearchBar onInputChange={handleInputChange} onSearchClick={handleSearchClick} />
        </div>

        {searchResponse && (
          <div>
            <div className="search-message">
              You searched for: {searchResponse},
              <ul>
                {extractedText
                  .filter((item, idx) => idx % 2 === 1)
                  .map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
              </ul>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="btn" type="button" onClick={() => setFoodModalOpen(true)}>
                Add Food
              </button>
              <button className="btn" type="button" onClick={addToList}>
                Add to List
              </button>
            </div>
          </div>
        )}

        {errors && <div className="error">{`Please fill out all categories`}</div>}

        {foodModalOpen && (
          <SelectFood
            closeFoodModal={() => {
              setFoodModalOpen(false);
              setRowToEdit(null);
            }}
            onSubmit={handleSubmit}
            inSearch={true}
            defaultValue={rowToEdit !== null}
            isEdit={rowToEdit !== null}
            extractedText={extractedText}
          />
        )}
      </div>
    </div>
  );
}

export default SearchModal;
