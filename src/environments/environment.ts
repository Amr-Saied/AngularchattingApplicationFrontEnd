const isHttps = window.location.protocol === 'https:';
export const environment = {
  production: false,
  apiUrl: isHttps ? 'https://localhost:7095/' : 'http://localhost:5194/',
  googleClientId:
    '806733993214-1ch1ndu3nm2i82nu6uoetgskjaofeua0.apps.googleusercontent.com', // Replace with your actual Google Client ID
};
