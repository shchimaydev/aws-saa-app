// Minimal types for the Google Identity Services (GIS) client library
// (https://accounts.google.com/gsi/client), loaded lazily in firebase.client.ts.

interface GsiTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  scope?: string;
}

interface GsiTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GsiTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GsiTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: GsiTokenClientConfig) => GsiTokenClient;
      };
    };
  };
}
