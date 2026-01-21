import React, { useState } from "react";
import "./Modal.css";
import { SearchBar } from "./SearchBarComponent/SearchBar";
import axios from "axios";
import SelectFood from "./FoodModal";
import { useUser} from "@clerk/clerk-react";

function SearchModal({ closeSearchModal, onSubmit }) {
  const [errors, setErrors] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [agentResponse, setAgentResponse] = useState(""); // New state for Agent
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState(null);
  const [usdaResponse, setUsdaResponse] = useState([]);
  const [pageSize, setPageSize] = useState(1);
  const { user } = useUser();

  const handleSubmit = async (newRow) => {
    onSubmit(newRow);
    try {
      await fetchFromBackend(`${process.env.REACT_APP_API_URL}/add-food-to-list`, "POST", {
        userID: user.id,
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

  const handleAgentSearchClick = async () => {
    const formData = new FormData();
    formData.append("message", searchInput);
    formData.append("pageSize", pageSize);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      setAgentResponse("Agent is thinking...");
      setUsdaResponse([]); 
      
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/get-agent-text`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const reply = res.data.reply;
      setAgentResponse(reply);

      const foodLines = reply.split('\n').filter(line => line.trim() !== "");

      const parsedFoods = foodLines.map(line => {
        const name = line.match(/Name:(.*?),/i)?.[1]?.trim();
        const protein = line.match(/Protein:(.*?),/i)?.[1]?.trim();
        const fats = line.match(/Fats:(.*?),/i)?.[1]?.trim();
        const carbs = line.match(/Carbs:(.*?),/i)?.[1]?.trim();
        const calories = line.match(/Calories:(.*?)$|Calories:(.*?),/i);
        
        const calValue = (calories?.[1] || calories?.[2])?.replace(/\./g, "").trim();

        return {
          name: name || "Unknown Food",
          protein: protein || "0",
          fats: fats || "0",
          carbs: carbs || "0",
          calories: calValue || "0"
        };
      });

      setUsdaResponse(parsedFoods);
      
    } catch (err) {
      console.error("Error calling Agent API:", err);
      setAgentResponse("Error fetching Agent response.");
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
            onFileChange={handleImageChange}
            accept="image/*"
            imagePreview={imagePreview}
            onClearImage={handleClearImage}
            showComponents={true}
          />

          <button 
            className="btn" 
            onClick={handleAgentSearchClick}
          >
            Test Agent Analysis
          </button>
        </div>

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