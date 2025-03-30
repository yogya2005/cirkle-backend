// src/services/groupService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

const GROUPS_COLLECTION = 'groups';
const USERS_COLLECTION = 'users';

// Create a new group
export const createGroup = async (groupData, userId) => {
  try {
    console.log(`Creating new group "${groupData.name}" for user ${userId}`);
    const groupRef = collection(db, GROUPS_COLLECTION);
    
    // Create a new group document with the creator as the first member
    const newGroup = {
      ...groupData,
      createdBy: userId,
      members: { [userId]: true }, // Using an object for quicker lookups
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Add document to Firestore
    const docRef = await addDoc(groupRef, newGroup);
    const groupId = docRef.id;
    console.log(`Group created with ID: ${groupId}`);
    
    // Update user's groups list
    await updateUserGroups(userId, groupId);
    
    // Return consistent data format for immediate display
    return { 
      id: groupId, 
      ...groupData,
      createdBy: userId,
      members: { [userId]: true },
      // Use a Date object for immediate display, but don't add toDate() method to avoid confusion
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Get all groups for a user
export const getUserGroups = async (userId) => {
  try {
    console.log(`Fetching groups for user ${userId}`);
    const groupsQuery = query(
      collection(db, GROUPS_COLLECTION),
      where(`members.${userId}`, '==', true)
    );
    
    const querySnapshot = await getDocs(groupsQuery);
    const groups = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${groups.length} groups for user ${userId}`);
    return groups;
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

// Get a single group by ID
export const getGroupById = async (groupId) => {
  try {
    console.log(`Fetching group with ID: ${groupId}`);
    const docRef = doc(db, GROUPS_COLLECTION, groupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`Group ${groupId} found`);
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.error(`Group ${groupId} not found`);
      throw new Error('Group not found');
    }
  } catch (error) {
    console.error(`Error getting group ${groupId}:`, error);
    throw error;
  }
};

// Join a group
export const joinGroup = async (groupId, userId) => {
  try {
    console.log(`Attempting to join group ${groupId} for user ${userId}`);
    
    // First check if the group exists
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      console.error(`Group ${groupId} not found`);
      throw new Error('Group not found');
    }
    
    const groupData = groupSnap.data();
    console.log('Group data retrieved:', { groupId, hasMembers: !!groupData.members });
    
    // Check if user is already a member
    if (groupData.members && groupData.members[userId] === true) {
      console.log(`User ${userId} is already a member of group ${groupId}`);
      throw new Error('Already a member');
    }
    
    // Add user to the group's members
    console.log(`Adding user ${userId} to group ${groupId}`);
    await updateDoc(groupRef, {
      [`members.${userId}`]: true,
      updatedAt: serverTimestamp()
    });
    
    // Update user's groups list
    console.log(`Updating user ${userId}'s group list to include ${groupId}`);
    await updateUserGroups(userId, groupId);
    
    console.log(`User ${userId} successfully joined group ${groupId}`);
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

// Leave a group
export const leaveGroup = async (groupId, userId) => {
  try {
    console.log(`User ${userId} is leaving group ${groupId}`);
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    
    // Remove user from the group's members list
    await updateDoc(groupRef, {
      [`members.${userId}`]: false, // Or use dot notation with Firebase to delete
      updatedAt: serverTimestamp()
    });
    
    // Remove group from user's groups list
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      groups: arrayRemove(groupId)
    });
    
    console.log(`User ${userId} successfully left group ${groupId}`);
    return true;
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};

// Helper function to update a user's groups
const updateUserGroups = async (userId, groupId) => {
  try {
    console.log(`Updating user ${userId}'s groups to include ${groupId}`);
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Update existing user document
      console.log(`User ${userId} exists, updating their groups`);
      await updateDoc(userRef, {
        groups: arrayUnion(groupId),
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new user document if it doesn't exist
      console.log(`User ${userId} doesn't exist in Firestore, creating new user document`);
      await setDoc(userRef, {
        uid: userId,
        groups: [groupId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`Successfully updated user ${userId}'s groups`);
  } catch (error) {
    console.error(`Error updating user ${userId}'s groups:`, error);
    throw error;
  }
};

// Get a group's invite link/code
export const getGroupInviteCode = (groupId) => {
  // For simplicity, we're just using the group ID as the invite code
  // In a production app, you might want to generate a separate code
  return groupId;
};