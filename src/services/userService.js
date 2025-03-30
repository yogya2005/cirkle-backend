// src/services/userService.js
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    serverTimestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  const USERS_COLLECTION = 'users';
  
  /**
   * Get user data by ID
   * @param {string} userId The user ID
   * @returns {Promise<Object|null>} The user data or null if not found
   */
  export const getUserById = async (userId) => {
    try {
      console.log(`Getting user data for ID: ${userId}`);
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log(`User found for ID: ${userId}`);
        return { id: userSnap.id, ...userSnap.data() };
      }
      
      console.log(`No user found for ID: ${userId}`);
      return null;
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  };
  
  /**
   * Create or update user data
   * @param {string} userId The user ID
   * @param {Object} userData The user data to store
   * @returns {Promise<Object>} The created/updated user data
   */
  export const updateUserData = async (userId, userData) => {
    try {
      console.log(`Updating user data for ID: ${userId}`);
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      // Merge with existing data if it exists
      await setDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Successfully updated user data for ID: ${userId}`);
      return { id: userId, ...userData };
    } catch (error) {
      console.error(`Error updating user data for ${userId}:`, error);
      throw error;
    }
  };
  
  /**
   * Create or update a user profile with authentication info
   * @param {Object} user The Firebase auth user object
   * @returns {Promise<Object>} The created/updated user profile
   */
  export const createUserProfile = async (user) => {
    try {
      const { uid, displayName, email, photoURL } = user;
      console.log(`Creating/updating user profile for ${displayName} (${uid})`);
      
      const userRef = doc(db, USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user profile
        console.log(`Creating new user profile for ${uid}`);
        const userData = {
          uid,
          displayName,
          email,
          photoURL,
          groups: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userRef, userData);
        console.log(`Successfully created new user profile for ${uid}`);
        return { id: uid, ...userData };
      } else {
        // Update existing user profile
        console.log(`Updating existing user profile for ${uid}`);
        const userData = {
          displayName,
          email,
          photoURL,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userRef, userData, { merge: true });
        console.log(`Successfully updated user profile for ${uid}`);
        return { id: uid, ...userSnap.data(), ...userData };
      }
    } catch (error) {
      console.error(`Error creating/updating user profile:`, error);
      throw error;
    }
  };
  
  /**
   * Get email addresses for a list of user IDs
   * @param {Array<string>} userIds The user IDs to look up
   * @returns {Promise<Array<string>>} Array of email addresses (may contain null for users without emails)
   */
  export const getUserEmails = async (userIds) => {
    try {
      console.log(`Looking up emails for ${userIds.length} users`);
      const emails = [];
      
      // Process in batches to avoid excessive reads
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const userDocs = await Promise.all(
          batch.map(userId => getUserById(userId))
        );
        
        userDocs.forEach(user => {
          if (user && user.email) {
            emails.push(user.email);
          } else {
            emails.push(null);
          }
        });
      }
      
      console.log(`Found ${emails.filter(Boolean).length} valid emails out of ${userIds.length} users`);
      return emails;
    } catch (error) {
      console.error(`Error getting user emails:`, error);
      throw error;
    }
  };