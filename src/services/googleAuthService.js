// src/services/googleAuthService.js
import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

// Only using the drive.file scope which is less restrictive and doesn't require verification
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file'  // For creating and managing files created by the app
];

// Get the Firebase Auth instance
const auth = getAuth();

// Initialize Google Auth Provider with drive.file scope
const googleProvider = new GoogleAuthProvider();
SCOPES.forEach(scope => googleProvider.addScope(scope));

/**
 * Request Google Drive permissions
 * @returns {Promise<Object>} Google auth result with token
 */
export const requestGooglePermissions = async () => {
  try {
    // Force account selection to get a fresh token with the right scope
    googleProvider.setCustomParameters({
      prompt: 'consent'
    });
    
    // Sign in with popup to get Google Auth result with token
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get the OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // Return relevant auth data
    return {
      user: result.user,
      token,
      expiresAt: new Date().getTime() + 3600 * 1000, // Token expires in 1 hour
    };
  } catch (error) {
    console.error('Error requesting Google permissions:', error);
    throw error;
  }
};

/**
 * Check if we have a valid Google API token
 * @returns {boolean} Whether we have a valid token
 */
export const hasValidGoogleToken = () => {
  const tokenData = JSON.parse(localStorage.getItem('googleTokenData') || '{}');
  const now = new Date().getTime();
  
  return tokenData.token && tokenData.expiresAt && tokenData.expiresAt > now;
};

/**
 * Save Google token data to localStorage
 * @param {Object} tokenData The token data to save
 */
export const saveGoogleTokenData = (tokenData) => {
  localStorage.setItem('googleTokenData', JSON.stringify(tokenData));
};

/**
 * Get the saved Google access token
 * @returns {string|null} The access token or null if not available
 */
export const getGoogleAccessToken = () => {
  if (!hasValidGoogleToken()) {
    return null;
  }
  
  const tokenData = JSON.parse(localStorage.getItem('googleTokenData') || '{}');
  return tokenData.token;
};

/**
 * Clear any saved Google token data
 */
export const clearGoogleTokenData = () => {
  localStorage.removeItem('googleTokenData');
};