// src/components/Groups/CreateGroup.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createGroup } from '../../services/groupService';

const CreateGroup = ({ onSuccess, onCancel }) => {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      // Create the group in Firestore
      const newGroup = await createGroup({
        name: groupName.trim(),
      }, user.uid);
      
      onSuccess(newGroup);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Study Group</h2>
      
      {error && <p>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="groupName">Group Name:</label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            required
          />
        </div>
        
        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
      
      <p>After creating, you'll get a unique Group ID to share with others so they can join.</p>
    </div>
  );
};

export default CreateGroup;