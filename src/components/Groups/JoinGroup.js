// src/components/Groups/JoinGroup.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { joinGroup, getGroupById } from '../../services/groupService';

const JoinGroup = ({ onSuccess, onCancel }) => {
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clean the input to remove any whitespace or invisible characters
    const cleanGroupId = groupId.trim();
    
    if (!cleanGroupId) {
      setError('Please enter a group ID');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting to join group with ID:', cleanGroupId);
      
      // First check if the group exists
      let groupData;
      try {
        groupData = await getGroupById(cleanGroupId);
        console.log('Group found:', groupData);
      } catch (fetchErr) {
        console.error('Error fetching group:', fetchErr);
        if (fetchErr.message === 'Group not found') {
          setError('No group found with this ID. Please check and try again.');
        } else {
          setError(`Error accessing group: ${fetchErr.message}`);
        }
        setLoading(false);
        return;
      }
      
      // Then join the group
      try {
        await joinGroup(cleanGroupId, user.uid);
        console.log('Successfully joined group');
        
        // Pass the joined group back to parent component
        onSuccess(groupData);
      } catch (joinErr) {
        console.error('Error joining group:', joinErr);
        if (joinErr.message === 'Already a member') {
          setError('You are already a member of this group.');
        } else {
          setError(`Failed to join group: ${joinErr.message}`);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Join an Existing Study Group</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="groupId">Group ID:</label>
          <input
            type="text"
            id="groupId"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Enter group ID"
            required
          />
        </div>
        
        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Joining...' : 'Join Group'}
          </button>
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
      
      <p>Ask your group creator for the Group ID to join their study group.</p>
    </div>
  );
};

export default JoinGroup;