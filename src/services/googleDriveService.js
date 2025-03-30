// src/services/googleDriveService.js - LINK SHARING VERSION
import { getGoogleAccessToken } from './googleAuthService';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const GROUPS_COLLECTION = 'groups';

/**
 * Create a new Google Doc through the Drive API
 * @param {string} groupId The ID of the group
 * @param {string} title The title of the new document
 * @param {Object} group The group data containing member information
 * @param {string} creatorUserId The ID of the user creating the document
 * @returns {Promise<Object>} The created document data
 */
export const createGroupDocument = async (groupId, title, group, creatorUserId) => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid Google access token found. Please authenticate with Google.');
  }
  
  try {
    console.log(`Creating document "${title}" for group ${groupId}`);
    
    // 1. Create a Google Doc through the Drive API
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.document' // This creates a Google Doc
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create document: ${error.error?.message || 'Unknown error'}`);
    }
    
    const docData = await response.json();
    console.log(`Document created with ID: ${docData.id}`);
    
    // 2. Get full file details including webViewLink
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docData.id}?fields=id,name,webViewLink`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!fileResponse.ok) {
      const error = await fileResponse.json();
      throw new Error(`Failed to get document details: ${error.error?.message || 'Unknown error'}`);
    }
    
    const fileDetails = await fileResponse.json();
    console.log(`Got document details with link: ${fileDetails.webViewLink}`);
    
    // 3. Set permissions to "Anyone with the link can edit"
    await setLinkSharingPermission(fileDetails.id, accessToken);
    console.log(`Set "Anyone with the link can edit" permission for document ${fileDetails.id}`);
    
    // 4. Store the document reference in Firestore
    // Use current date instead of serverTimestamp() for arrays
    const currentDate = new Date().toISOString();
    const documentData = {
      id: fileDetails.id,
      name: fileDetails.name,
      url: fileDetails.webViewLink,
      createdBy: creatorUserId,
      createdAt: currentDate,
      type: 'google_doc'
    };
    
    await addResourceToGroup(groupId, 'documents', documentData);
    console.log(`Document reference added to group in Firestore`);
    
    return documentData;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Upload a file to Google Drive and set link sharing
 * @param {string} groupId The ID of the group
 * @param {File} file The file to upload
 * @param {Object} group The group data containing member information
 * @param {string} creatorUserId The ID of the user uploading the file
 * @returns {Promise<Object>} The uploaded file data
 */
export const uploadGroupFile = async (groupId, file, group, creatorUserId) => {
  const accessToken = getGoogleAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid Google access token found. Please authenticate with Google.');
  }
  
  try {
    console.log(`Uploading file "${file.name}" for group ${groupId}`);
    
    // 1. Upload file to Google Drive
    const metadata = {
      name: file.name,
      mimeType: file.type
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Failed to upload file: ${error.error?.message || 'Unknown error'}`);
    }
    
    const uploadedFile = await uploadResponse.json();
    console.log(`File uploaded with ID: ${uploadedFile.id}`);
    
    // 2. Get full file details including webViewLink
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${uploadedFile.id}?fields=id,name,mimeType,webViewLink,size`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!fileResponse.ok) {
      const error = await fileResponse.json();
      throw new Error(`Failed to get file details: ${error.error?.message || 'Unknown error'}`);
    }
    
    const fileDetails = await fileResponse.json();
    console.log(`Got file details with link: ${fileDetails.webViewLink}`);
    
    // 3. Set permissions to "Anyone with the link can edit"
    await setLinkSharingPermission(fileDetails.id, accessToken);
    console.log(`Set "Anyone with the link can edit" permission for file ${fileDetails.id}`);
    
    // 4. Store the file reference in Firestore
    // Use current date instead of serverTimestamp() for arrays
    const currentDate = new Date().toISOString();
    const fileData = {
      id: fileDetails.id,
      name: fileDetails.name,
      url: fileDetails.webViewLink,
      mimeType: fileDetails.mimeType,
      size: fileDetails.size || file.size,
      createdBy: creatorUserId,
      createdAt: currentDate
    };
    
    await addResourceToGroup(groupId, 'files', fileData);
    console.log(`File reference added to group in Firestore`);
    
    return fileData;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Set "Anyone with the link can edit" permission on a file
 * @param {string} fileId The ID of the file
 * @param {string} accessToken Google access token
 * @returns {Promise<Object>} The permission response
 */
const setLinkSharingPermission = async (fileId, accessToken) => {
  try {
    console.log(`Setting link sharing permission for file ${fileId}`);
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'anyone',
        allowFileDiscovery: false
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.warn(`Warning: Failed to set link sharing: ${error.error?.message || 'Unknown error'}`);
      return null;
    }
    
    console.log(`Successfully set link sharing for file ${fileId}`);
    return response.json();
  } catch (error) {
    console.warn(`Warning: Error setting link sharing:`, error);
    return null;
  }
};

/**
 * Add a resource to a group in Firestore
 * @param {string} groupId The ID of the group
 * @param {string} resourceType The type of resource ('documents' or 'files')
 * @param {Object} resourceData The resource data to add
 * @returns {Promise<void>}
 */
const addResourceToGroup = async (groupId, resourceType, resourceData) => {
  try {
    console.log(`Adding ${resourceType} to group ${groupId} in Firestore`);
    const groupRef = doc(db, GROUPS_COLLECTION, groupId);
    const groupSnapshot = await getDoc(groupRef);
    
    if (groupSnapshot.exists()) {
      const groupData = groupSnapshot.data();
      let resources = groupData.resources || {};
      let resourceArray = resources[resourceType] || [];
      
      // Add the new resource to the array
      resourceArray.push(resourceData);
      
      // Update the resources object
      resources = {
        ...resources,
        [resourceType]: resourceArray
      };
      
      // Update the document with the new resources object and a timestamp
      await updateDoc(groupRef, {
        resources: resources,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Successfully added ${resourceType} to group`);
      return true;
    } else {
      throw new Error(`Group ${groupId} not found`);
    }
  } catch (error) {
    console.error(`Error adding ${resourceType} to group:`, error);
    throw error;
  }
};