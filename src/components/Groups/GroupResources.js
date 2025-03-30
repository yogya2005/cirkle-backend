// src/components/Groups/GroupResources.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { requestGooglePermissions, hasValidGoogleToken, saveGoogleTokenData } from '../../services/googleAuthService';
import { createGroupDocument, uploadGroupFile } from '../../services/googleDriveService';

const GroupResources = ({ group }) => {
  const [newDocName, setNewDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { user } = useAuth();

  // Extract documents and files from the group resources or initialize empty arrays
  const documents = group?.resources?.documents || [];
  const files = group?.resources?.files || [];

  // Request Google permissions if needed
  const ensureGooglePermissions = async () => {
    if (!hasValidGoogleToken()) {
      try {
        setMessage('Requesting Google Drive permissions...');
        const tokenData = await requestGooglePermissions();
        saveGoogleTokenData(tokenData);
        setMessage('Permissions granted successfully!');
        return true;
      } catch (error) {
        console.error('Failed to get Google permissions:', error);
        setError('Please grant permission to access Google Drive to create documents and upload files.');
        setMessage(null);
        return false;
      }
    }
    return true;
  };

  // Create a new Google Doc
  const handleCreateDocument = async (e) => {
    e.preventDefault();
    
    if (!newDocName.trim()) {
      setError('Please enter a document name');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage('Preparing to create document...');
      
      // Ensure we have Google permissions
      const hasPermissions = await ensureGooglePermissions();
      if (!hasPermissions) {
        setLoading(false);
        return;
      }
      
      setMessage('Creating document in Google Drive...');
      
      // Create the document
      const docData = await createGroupDocument(
        group.id, 
        newDocName.trim(), 
        group, 
        user.uid
      );
      
      setNewDocName('');
      setMessage('Document created successfully! You may need to refresh to see it in the list.');
      
      // The resource is added to Firestore in the service, so we don't need to do it here
      
    } catch (error) {
      console.error('Error creating document:', error);
      setError(`Failed to create document: ${error.message}`);
      setMessage(null);
    } finally {
      setLoading(false);
      // Clear success message after a delay
      if (!error) {
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload a file to Google Drive
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage('Preparing to upload file...');
      
      // Ensure we have Google permissions
      const hasPermissions = await ensureGooglePermissions();
      if (!hasPermissions) {
        setLoading(false);
        return;
      }
      
      setMessage('Uploading file to Google Drive...');
      
      // Upload the file
      const fileData = await uploadGroupFile(
        group.id, 
        selectedFile, 
        group, 
        user.uid
      );
      
      setSelectedFile(null);
      setMessage('File uploaded successfully! You may need to refresh to see it in the list.');
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // The resource is added to Firestore in the service, so we don't need to do it here
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`Failed to upload file: ${error.message}`);
      setMessage(null);
    } finally {
      setLoading(false);
      // Clear success message after a delay
      if (!error) {
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  // Helper function to format date
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
      return 'Unknown';
    }
  };

  return (
    <div>
      <h2>Group Resources</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      
      {/* Create Document Form */}
      <div>
        <h3>Create New Document</h3>
        <form onSubmit={handleCreateDocument}>
          <div>
            <label htmlFor="docName">Document Name:</label>
            <input
              type="text"
              id="docName"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="Enter document name"
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading || !newDocName.trim()}>
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </form>
      </div>
      
      {/* Upload File Form */}
      <div>
        <h3>Upload File</h3>
        <form onSubmit={handleFileUpload}>
          <div>
            <label htmlFor="file-upload">Select File:</label>
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading || !selectedFile}>
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
      
      {/* Documents List */}
      <div>
        <h3>Documents</h3>
        {documents.length > 0 ? (
          <ul>
            {documents.map((doc) => (
              <li key={doc.id}>
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  {doc.name}
                </a>
                <span> - Created: {formatDate(doc.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No documents yet. Create one to get started!</p>
        )}
      </div>
      
      {/* Files List */}
      <div>
        <h3>Files</h3>
        {files.length > 0 ? (
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
                <span> - {formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No files yet. Upload one to get started!</p>
        )}
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default GroupResources;