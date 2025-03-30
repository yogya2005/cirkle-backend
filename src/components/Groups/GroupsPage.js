// src/components/Groups/GroupsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserGroups } from '../../services/groupService';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's groups when component mounts
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (user) {
          setLoading(true);
          const userGroups = await getUserGroups(user.uid);
          setGroups(userGroups);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleCreateSuccess = (newGroup) => {
    setGroups([...groups, newGroup]);
    setShowCreateForm(false);
  };

  const handleJoinSuccess = (joinedGroup) => {
    // Check if group already exists in state
    if (!groups.some(group => group.id === joinedGroup.id)) {
      setGroups([...groups, joinedGroup]);
    }
    setShowJoinForm(false);
  };

  // Helper function to format dates safely
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    // If it's a Firebase timestamp with toDate method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return new Date(timestamp.toDate()).toLocaleDateString();
    }
    
    // If it's a regular Date object or timestamp
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (err) {
      return 'Invalid date';
    }
  };

  return (
    <div>
      <h1>My Study Groups</h1>
      
      {error && <p>{error}</p>}
      
      <div>
        <button onClick={() => setShowCreateForm(true)}>Create New Group</button>
        <button onClick={() => setShowJoinForm(true)}>Join Existing Group</button>
      </div>
      
      {showCreateForm && (
        <CreateGroup 
          onSuccess={handleCreateSuccess} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}
      
      {showJoinForm && (
        <JoinGroup 
          onSuccess={handleJoinSuccess} 
          onCancel={() => setShowJoinForm(false)} 
        />
      )}
      
      {loading ? (
        <p>Loading groups...</p>
      ) : groups.length > 0 ? (
        <div>
          <h2>Your Groups:</h2>
          <ul>
            {groups.map(group => (
              <li key={group.id}>
                <div onClick={() => handleGroupClick(group.id)}>
                  <h3>{group.name}</h3>
                  <p>Members: {Object.keys(group.members || {}).length}</p>
                  <p>Created: {formatDate(group.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>You don't have any groups yet. Create or join a group to get started!</p>
      )}
    </div>
  );
};

export default GroupsPage;