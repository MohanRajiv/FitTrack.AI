import React, { useState } from "react";
import "./Modal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";
import SelectFood from "./FoodModal";

function SearchModal({ closeSearchModal, onSubmit }) {
  const [errors, setErrors] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchResponse, setSearchResponse] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState(null);
  const [extractedText, setExtractedText] = useState([]);
  const [usdaResponse, setUsdaResponse] = useState([]);
  const [pageSize, setPageSize] = useState(1);

  const handleSubmit = async (newRow) => {
    const user = JSON.parse(localStorage.getItem("user"));
    onSubmit(newRow);
    try {
      await fetchFromBackend(`${process.env.REACT_APP_API_URL}/add-food-to-list`, "POST", {
        userID: user.userID,
        name: newRow.name,
        protein: newRow.protein,
        fats: newRow.fats,
        carbs: newRow.carbs,
        calories: newRow.calories,
      });
    } catch (error) {
      console.error("Error adding to food list:", error);
    }
    closeSearchModal();
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
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
    formData.append("pageSize", pageSize);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/get-gemini-text`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setSearchResponse(res.data.reply);
      setUsdaResponse(res.data.usda || []);

      const colonSplit = res.data.reply.split(":");
      const commaSplit = colonSplit.flatMap((part) => part.split(","));
      setExtractedText(commaSplit.map((str) => str.trim()));
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setSearchResponse("Error fetching Gemini response.");
    }
  };

  const fetchFromBackend = async (url, method, body) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      if (response.headers.get("Content-Type")?.includes("application/json")) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error(`Error during ${method} request to ${url}:`, error.message);
      throw error;
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

        <div style={{ marginBottom: "10px" }}>
          <label>Results per search: </label>
          <input
            type="number"
            min="1"
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value)}
          />
        </div>

        <div className="search-bar-container">
          <SearchBar
            onInputChange={handleInputChange}
            onSearchClick={handleSearchClick}
            onFileChange={handleImageChange}
            accept="image/*"
            imagePreview={imagePreview}
            onClearImage={handleClearImage}
            showComponents={true}
          />
        </div>

        {/* === Gemini Results === */}
        {searchResponse && (
          <div style={{ marginBottom: "15px" }}>
            <p>
              <strong>Gemini Analysis:</strong>
            </p>
            <div
              className="search-message"
              onClick={() => {
                setRowToEdit({
                  name: extractedText[1] || "",
                  protein: extractedText[3] || "",
                  fats: extractedText[5] || "",
                  carbs: extractedText[7] || "",
                  calories: extractedText[9] || "",
                  meal: "",
                });
                setFoodModalOpen(true);
              }}
            >
              {searchResponse}
            </div>
          </div>
        )}

        {/* === USDA Results === */}
        {usdaResponse.length > 0 && (
          <div>
            <p>
              <strong>
                USDA Nutrition Info (Top {usdaResponse.length} Results):
              </strong>
            </p>
            <ul
              style={{
                textAlign: "left",
                listStyleType: "none",
                padding: 0,
                margin: 0,
              }}
            >
              {usdaResponse.map((food, idx) => (
                <li key={idx} style={{ marginBottom: "15px" }}>
                  <div
                    className="search-message"
                    onClick={() => {
                      setRowToEdit({
                        ...food,
                        meal: food.meal || "",
                      });
                      setFoodModalOpen(true);
                    }}
                  >
                    <strong>{food.name}</strong>
                    <ul>
                      <li>Calories: {food.calories}</li>
                      <li>Protein: {food.protein} g</li>
                      <li>Fats: {food.fats} g</li>
                      <li>Carbs: {food.carbs} g</li>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors && <div className="error">Please fill out all categories</div>}

        {foodModalOpen && rowToEdit && (
          <SelectFood
            closeFoodModal={() => {
              setFoodModalOpen(false);
              setRowToEdit(null);
            }}
            onSubmit={handleSubmit}
            inSearch={true}
            defaultValue={rowToEdit}
            isEdit={false}
          />
        )}
      </div>
    </div>
  );
}

export default SearchModal;
