const isHttps = window.location.protocol === 'https:';
export const environment = {
  production: true,
  apiUrl: isHttps
    ? 'https://your-production-api-url/api/'
    : 'http://your-production-api-url/api/',
  usersUrl: isHttps
    ? 'https://your-production-api-url/Users'
    : 'http://your-production-api-url/Users',
  accountUrl: isHttps
    ? 'https://your-production-api-url/api/account'
    : 'http://your-production-api-url/api/account',
};
