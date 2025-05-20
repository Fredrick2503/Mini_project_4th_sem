
import { supabase } from "@/lib/supabase";

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

/**
 * Checks if a token is expired by comparing its expiration time with current time
 * @param expiresAt Timestamp when token expires
 * @returns Boolean indicating if token is expired
 */
export const isTokenExpired = (expiresAt: number): boolean => {
  // Add 5 minute buffer to account for time differences and network delays
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= expiresAt - bufferTime;
};

/**
 * Refreshes Google access token using the backend refresh endpoint
 * @param userId User ID whose token needs to be refreshed
 * @returns New token data or null if refresh failed
 */
export const refreshGoogleToken = async (userId: string): Promise<GoogleTokens | null> => {
  try {
    // Call backend refresh endpoint
    const { data: {session} } = await supabase.auth.getSession();
    const response = await fetch(`https://xhwgwwxmzfedaijvgvld.supabase.co/functions/v1/google-refresh-token`, {
      method: 'POST',
      headers:  {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text());
      return null;
    }

    const tokenData = await response.json();
    console.log(tokenData);
    
    // Update the token in the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        google_access_token: tokenData.access_token,
        google_token_expires_at: tokenData.expires_at
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update token in database:', error);
      return null;
    }

    return tokenData;
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
};

/**
 * Middleware for Google API calls that handles token refresh if needed
 * @param userId User ID making the API call
 * @param apiCall Function that makes the actual API call
 * @returns Result of the API call
 */
export const withGoogleTokenRefresh = async <T>(
  userId: string, 
  apiCall: (accessToken: string) => Promise<T>
): Promise<T | null> => {
  try {
    // Get current tokens from the database
    const { data: userData, error } = await supabase
      .from('profiles')
      .select('google_access_token, google_token_expires_at')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      console.error('Failed to get user token data:', error);
      return null;
    }

    let accessToken = userData.google_access_token;
    const tokenExpiresAt = userData.google_token_expires_at;

    // Check if token is expired and refresh if needed
    if (isTokenExpired(tokenExpiresAt)) {
      const newTokens = await refreshGoogleToken(userId);
      if (!newTokens) {
        return null;
      }
      accessToken = newTokens.access_token;
    }

    // Make the API call with valid token
    return await apiCall(accessToken);

  } catch (error) {
    console.error('Error in Google API middleware:', error);
    return null;
  }
};

/**
 * Example of using the middleware to make a Google Classroom API call
 */
export const fetchGoogleClassroomCourses = async (userId: string): Promise<any[] | null> => {
  return withGoogleTokenRefresh(userId, async (accessToken) => {
    const response = await fetch('https://classroom.googleapis.com/v1/courses', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google Classroom API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.courses || [];
  });
};
export const fetchGoogleClassroomCoursesMaterials = async (userId: string,courseId:string): Promise<any[] | null> => {
  return withGoogleTokenRefresh(userId, async (accessToken) => {
    const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google Classroom API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("response",data);
    return data.courseWorkMaterial || [];
  });
};
