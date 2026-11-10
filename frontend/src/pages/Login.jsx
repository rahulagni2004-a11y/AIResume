
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("/login", formData);

      const token =
        response.data.access_token || response.data.token;

      if (!token) {
        throw new Error("Login response did not contain a token");
      }

      localStorage.setItem("access_token", token);

      setMessage("Login successful!");

      navigate("/dashboard");

    } catch (error) {

      if (!error.response) {
        setMessage(
          "Unable to connect to the server. Please try again."
        );
      } else if (error.response.status === 401) {
        setMessage("Invalid email or password.");
      } else {
        setMessage(
          error.response.data?.detail ||
          "Login failed. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>AIResume</h1>

        <p className="auth-subtitle">
          Welcome back! Login to your account
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className="auth-footer">{message}</p>}

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
