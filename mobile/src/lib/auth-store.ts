import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'vendetta_musician_token';
const USER_KEY = 'vendetta_musician_user';

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  musicianProfileId: string | null;
}

export async function saveSession(token: string, user: MobileUser) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function getSessionUser(): Promise<MobileUser | null> {
  try {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function clearSession() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// Development IP or Production domain.
// Next.js development server is running on port 3006.
export const API_BASE_URL = 'http://localhost:3006';
