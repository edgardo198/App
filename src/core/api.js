import axios from 'axios';
import { Platform } from 'react-native';

const ADDRESS = Platform.OS === 'ios'
    ? 'http://192.168.1.47:8000'
    : 'http://192.168.1.39:8000'


const api = axios.create({
    baseURL: ADDRESS, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export default api;
