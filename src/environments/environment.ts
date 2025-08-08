const isHttps = window.location.protocol === 'https:';
export const environment = {
  production: false,
  apiUrl: isHttps ? 'https://localhost:7095/' : 'http://localhost:5194/',
  googleClientId:
    '806733993214-1ch1ndu3nm2i82nu6uoetgskjaofeua0.apps.googleusercontent.com', // Replace with your actual Google Client ID
  security: {
    enableEncryption: true,
    encryptionKey: 'e052bf7ee91527651ec06ae4a0a7f306',
    tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    enableSecureStorage: true,
    enableTokenValidation: true,
  },
  // PRODUCTION SETTINGS (COMMENTED FOR DEVELOPMENT)
  // forceHttps: true,
  // csp: {
  //   enableStrictMode: true,
  //   allowedDomains: ['your-production-api-url'],
  // },
};
