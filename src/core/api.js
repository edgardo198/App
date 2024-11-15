import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'ios'
    ? 'http://localhost:8000'  
    : 'http://192.168.1.39:8000';  



const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Error con respuesta del servidor
            console.error('API Error Response:', error.response.data);
        } else if (error.request) {
            // Error sin respuesta (problema de red o servidor inalcanzable)
            console.error('API Error Request:', error.request);
        } else {
            // Otro error durante la configuración de la solicitud
            console.error('API Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
