// src/components/Groups/GroupDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getGroupById, getGroupInviteCode, leaveGroup } from '../../services/groupService';
import GroupResources from './GroupResources';

const GroupDetails = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const groupData = await getGroupById(groupId);
        setGroup(groupData);
      } catch (err) {
        console.error('Error fetching group details:', err);
        setError('Failed to load group details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(groupId, user.uid);
        navigate('/groups');
      } catch (err) {
        console.error('Error leaving group:', err);
        setError('Failed to leave group. Please try again.');
      }
    }
  };

  const toggleInviteCode = () => {
    setShowInviteCode(!showInviteCode);
  };

  const copyInviteCode = () => {
    const code = getGroupInviteCode(groupId);
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
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

  // Function to refresh group data
  const refreshGroupData = async () => {
    try {
      setLoading(true);
      const groupData = await getGroupById(groupId);
      setGroup(groupData);
    } catch (err) {
      console.error('Error refreshing group details:', err);
      setError('Failed to refresh group details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading group details...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={() => navigate('/groups')}>Back to Groups</button>
      </div>
    );
  }

  if (!group) {
    return (
      <div>
        <p>Group not found.</p>
        <button onClick={() => navigate('/groups')}>Back to Groups</button>
      </div>
    );
  }

  const memberCount = Object.keys(group.members || {}).filter(key => group.members[key]).length;
  const isCreator = group.createdBy === user.uid;

  return (
    <div>
      <h1>{group.name}</h1>
      
      <div>
        <p>Created: {formatDate(group.createdAt)}</p>
        <p>Members: {memberCount}</p>
        <button onClick={refreshGroupData}>Refresh Group Data</button>
      </div>
      
      <div>
        <button onClick={toggleInviteCode}>
          {showInviteCode ? 'Hide Invite Code' : 'Show Invite Code'}
        </button>
        
        {showInviteCode && (
          <div>
            <p>Share this code with others to invite them to your group:</p>
            <div>
              <strong>{getGroupInviteCode(groupId)}</strong>
              <button onClick={copyInviteCode}>Copy</button>
            </div>
          </div>
        )}
      </div>
      
      {/* Add the Group Resources component */}
      <GroupResources group={group} />
      
      {!isCreator && (
        <div>
          <button onClick={handleLeaveGroup}>Leave Group</button>
        </div>
      )}
      
      <button onClick={() => navigate('/groups')}>Back to Groups</button>
    </div>
  );
};

export default GroupDetails;