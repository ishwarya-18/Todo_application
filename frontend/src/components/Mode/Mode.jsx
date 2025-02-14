import React, { useState } from 'react';
import './Mode.css';

function ModeToggle() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode); // Toggle logic is correct
    };

    return (
        <button className="mode-toggle-button" onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
    );
}

export default ModeToggle;
