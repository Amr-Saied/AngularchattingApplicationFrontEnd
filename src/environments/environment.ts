const isHttps = window.location.protocol === 'https:';
export const environment = {
  production: false,
  apiUrl: isHttps ? 'https://localhost:7095/' : 'http://localhost:5194/',
};
