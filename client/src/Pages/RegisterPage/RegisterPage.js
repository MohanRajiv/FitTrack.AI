import React, { useState } from "react";
import Header from "../../Components/Header/Header";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    fetch(`${process.env.REACT_APP_API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })
      .then((response) => {
        if (response.ok) {
          alert("User registered successfully");
        } else {
          alert("Failed to register user");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred");
      });
  };

  return (
    <div className="App">
      <div className="register">
        <div className="left-h">
            <Header
              showHeaderMenu={false}
            />
            <h1>Register</h1>
            <div className = "inputs">
              <div className = "input">
                <h3>Name</h3>
                <input type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className = "input">
                <h3>Email</h3>
                <input type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className = "input">
                <h3>Password</h3>
                <input type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <button onClick={handleRegister}>Register</button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default Register;