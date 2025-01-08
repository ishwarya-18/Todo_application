import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './TodoList.css';
import taskImage from '../assets/todo-image.png';
import schoolLogo from '../assets/college-logo.png';

function TaskManager() {
    const [newTask, setNewTask] = useState('');
    const [taskList, setTaskList] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const apiBaseURL = 'http://localhost:5000/todos';

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/');
                return;
            }

            try {
                const response = await fetch(apiBaseURL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();
                console.log("Fetched tasks:", data);  // Check if data is correctly fetched

                if (Array.isArray(data)) {
                    setTaskList(data);  // Update taskList with fetched data
                } else {
                    setError('Invalid task data format.');
                }
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to load tasks. Please try again.');
            }
        };

        fetchTasks();
        checkAdminStatus();  // This is fine here
    }, [navigate, apiBaseURL]);   // Correct dependencies to re-run the effect if needed

    const checkAdminStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);  // Decode token to check the user role
            setIsAdmin(decodedToken?.role === 'admin');  // Set admin status based on role
        }
    };    

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) {
            setError('Task cannot be empty.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                apiBaseURL,
                { title: newTask.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTaskList([...taskList, response.data]);
            setNewTask('');
            setError(null);
        } catch (err) {
            console.error('Error adding task:', err.message);
            setError('Failed to add task. Please try again.');
        }
    };

    const handleToggleTaskCompletion = async (taskId, e) => {
        e.stopPropagation();  // Prevent event bubbling
        try {
            const token = localStorage.getItem('token');
            const taskToUpdate = taskList.find((task) => task.id === taskId);
            const updatedStatus = !taskToUpdate.completed;

            const response = await axios.patch(
                `${apiBaseURL}/${taskId}`,  // Ensure this URL matches the backend route
                { completed: updatedStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTaskList((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === taskId ? { ...task, completed: response.data.completed } : task
                )
            );
        } catch (err) {
            console.error('Error updating task status:', err.message);
            setError('Failed to update task status. Please try again.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiBaseURL}/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setTaskList(taskList.filter((task) => task.id !== taskId));
            setError(null);
        } catch (err) {
            console.error('Error deleting task:', err.message);
            setError('Failed to delete the task. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleToggleMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode);
    };

    const handleAdminPage = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in first.');
            navigate('/');
            return;
        }
    
        // Ensure the token is valid by decoding it (you can use jwt-decode or any other package)
        try {
            const decodedToken = jwtDecode(token);  // Decoding the token to check role
            if (decodedToken?.role === 'admin') {
                navigate('/admin');  // If the role is admin, navigate to the admin page
            } else {
                alert('You are not authorized to access the admin page.');
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            alert('Token is invalid or expired.');
            navigate('/');
        }
    };

    return (
        <div className="task-manager-container">
            <div className="task-form-container">
                <div className="task-header-section">
                    <div className="task-header-item">
                        <img src={taskImage} className="todo-logo" alt="To-Do List" />
                        <h2>Task Manager</h2>
                    </div>
                    <div className="task-header-item">
                        <img src={schoolLogo} className="school-logo" alt="College Logo" />
                        <span>Welcome to Your Task Manager</span>
                    </div>
                </div>

                <form onSubmit={handleAddTask} className="task-form">
                    <label htmlFor="new-task">New Task:</label>
                    <input
                        type="text"
                        id="new-task"
                        placeholder="Enter a new task"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={!newTask}>Add Task</button>
                </form>

                {error && <div className="error-message">{error}</div>}

                <div className="task-list">
                    {Array.isArray(taskList) && taskList.length === 0 ? (
                        <p>No tasks added yet!</p>
                    ) : (
                        Array.isArray(taskList) && taskList.map((task) => (
                            <div key={task.id} className="task-item">
                                <div onClick={(e) => handleToggleTaskCompletion(task.id, e)} className={`task-circle ${task.completed ? 'marked' : ''}`}>
                                    {task.completed && <span className="checkmark">&#10004;</span>}
                                </div>

                                <span
                                    style={{
                                        textDecoration: task.completed ? 'line-through' : 'none',
                                        opacity: task.completed ? 0.6 : 1,
                                    }}
                                >
                                    {task.task}  {/* Ensure this matches the task's title */}
                                </span>
                                {task.completed && (
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="delete-task-button"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isAdmin && (
                <button onClick={handleAdminPage} className="admin-button">Admin</button>
            )}
            <div className="button-container">
                <button className="combined-button">
                    <span className="left-half" onClick={handleLogout}>
                        Logout
                    </span>
                    <span className="right-half" onClick={handleToggleMode}>
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>
            </div>
        </div>
    );
}

export default TaskManager;
