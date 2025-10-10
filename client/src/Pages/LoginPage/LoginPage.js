import React, { useState } from "react";
import { data, useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate()

    const handleLogin = () => {
      fetch(`${process.env.REACT_APP_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.user) {
            alert("User logged in successfully");
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/user");
          }
        })
        .catch((error) => {
          console.error("Login error:", error);
        });
    };

    return (
      <div className="App">
        <div className="login">
          <div className="left-h">
            <Header
              showHeaderMenu={false}
            />
            <h1>Login Page</h1>
            <div className = "inputs">
              <div className = "input">
                <h3>Email</h3>
                <input type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className = "input">
                <h3>Password</h3>
                <input type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button onClick={handleLogin}>Log-in</button>
            </div>
          </div>
        </div>
      </div>
    );
}

export default Login;