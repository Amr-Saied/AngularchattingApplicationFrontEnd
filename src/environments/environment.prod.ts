const isHttps = window.location.protocol === 'https:';
export const environment = {
  production: true,
  // PRODUCTION URLS (COMMENTED FOR DEVELOPMENT)
  // apiUrl: isHttps
  //   ? 'https://your-production-api-url/api/'
  //   : 'http://your-production-api-url/api/',
  // usersUrl: isHttps
  //   ? 'https://your-production-api-url/Users'
  //   : 'http://your-production-api-url/Users',
  // accountUrl: isHttps
  //   ? 'https://your-production-api-url/api/account'
  //   : 'http://your-production-api-url/api/account',

  // DEVELOPMENT URLS (FOR TESTING)
  apiUrl: isHttps ? 'https://localhost:7095/' : 'http://localhost:5194/',
  usersUrl: isHttps
    ? 'https://localhost:7095/Users'
    : 'http://localhost:5194/Users',
  accountUrl: isHttps
    ? 'https://localhost:7095/api/account'
    : 'http://localhost:5194/api/account',

  googleClientId:
    '806733993214-1ch1ndu3nm2i82nu6uoetgskjaofeua0.apps.googleusercontent.com',

  // Security configurations
  security: {
    enableEncryption: true,
    encryptionKey: 'your-super-secure-production-key-change-this-immediately',
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
