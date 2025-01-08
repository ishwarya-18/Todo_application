import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Add this line to import axios
import ModeToggle from '../components/Mode/Mode'; // Import ModeToggle
import './Login.css'; // Import the shared CSS
import todoImage from '../assets/todo-image.png'; // Replace with your To-Do list image path
import collegeLogo from '../assets/college-logo.png'; // Replace with your college logo path

function Auth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup forms
    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');  // Reset error message before each submission
    
        if (!isLogin && password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
    
        const url = `http://localhost:5000${isLogin ? '/auth/login' : '/auth/signup'}`;
        const payload = {
            email,
            password,
            ...(isLogin ? {} : { name })  // Only send name if it's a signup
        };
    
        try {
            const response = await axios.post(url, payload);
            console.log(response.data);  // Check response from backend
    
            if (response.status === 201 || response.status === 200) {
                console.log(`${isLogin ? 'Login' : 'Signup'} successful`);
                console.log('Token:', response.data.token);  // Debugging the token
                // Store token in localStorage
                localStorage.setItem("token", response.data.token);
                // Redirect to To-Do page
                if (isLogin) {
                    navigate('/todo');  // Redirect to To-Do page after login
                } else {
                    alert(response.data.message);  // Show message from the backend
                    setIsLogin(true);                }
            }   else {
                alert(response.data.error || 'Authentication failed');
            }
        } catch (err) {
            console.error('Error during authentication:', err.message);
            
            // Handle signup errors like duplicate email
            if (err.response) {
                if (err.response.status === 400) {
                    if (err.response.data.error === 'No user found with this email') {
                        alert('No user found with this email! Please sign up.');
                    } else if (err.response.data.error === 'Invalid password') {
                        setErrorMessage('Incorrect password'); // Set error message for login failure
                    } else {
                        alert(err.response.data.error || 'An error occurred during authentication');
                    }
                }
            }
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-form">
                {/* Header Section */}
                <div className="auth-header">
                    {/* To-Do List Section */}
                    <div className="auth-header-item">
                        <img src={todoImage} className="todo-logo" alt="To-Do List" />
                        <h2>To-Do List</h2>
                    </div>

                    {/* Sign In/Sign Up Section */}
                    <div className="auth-header-item">
                        <img src={collegeLogo} className="college-logo" alt="College Logo" />
                        <span>{isLogin ? 'Login' : 'Sign Up'}</span>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <>
                            <label htmlFor="name">Name:</label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {/* Error message for incorrect password */}
                    {isLogin && errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                    )}
                    {!isLogin && (
                        <>
                            <label htmlFor="confirmPassword">Confirm Password:</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
                </form>

                {/* Toggle Link */}
                <p className="auth-toggle-link">
                    {isLogin ? "Don't have an account? " : "Already have an account? "} 
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Register' : 'Login'}
                    </span>
                </p>
            </div>
            
            <ModeToggle />
        </div>
    );
}

export default Auth;
