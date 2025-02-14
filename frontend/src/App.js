import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login/Login';
import TaskManager from './TodoList/TodoList';
import AdminPage from './Admin/Admin';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/todo" element={<TaskManager />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Router>
    );
}

export default App;