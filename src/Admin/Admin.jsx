import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function AdminPage() {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    // Fetch users when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get('http://localhost:5000/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUsers(response.data); // Store the fetched users in the state
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [navigate]);

    // Function to handle user deletion
    const deleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`http://localhost:5000/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUsers(users.filter((user) => user.id !== userId)); // Update state after deletion
            console.log(response.data); // Log the response for debugging
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };
    
    return (
        <div className="admin-page-container" style={{ position: 'relative' }}>
    <button className="back-button" onClick={() => navigate('/todo')}>
        Back to Task Page
    </button>
    <h2 className="admin-header">Admin Dashboard</h2>
    <div className="users-container">
        {users.length > 0 ? (
            <ul className="user-list">
                {users.map((user) => (
                    <li className="user-item" key={user.id}>
                        <span className="user-email">{user.email}</span>
                        <span
                            className="delete-cross"
                            onClick={() => deleteUser(user.id)}
                        >
                            ×
                        </span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="no-users-message">No users found.</p>
        )}
    </div>
</div>

    );
}

export default AdminPage;
