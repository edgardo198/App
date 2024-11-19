import { create } from 'zustand';
import { ADDRESS } from './api'; // Asegúrate de que ADDRESS esté exportado en api.js
import secure from './secure';
import api from './api';

const useGlobal = create((set, get) => ({
    initialized: false,
    authenticated: false,
    user: {},

    // Inicializar la autenticación
    init: async () => {
        try {
            const credentials = await secure.get('credentials');
            if (credentials) {
                const response = await api.post('/chat/signin/', {
                    username: credentials.username,
                    password: credentials.password,
                });

                if (response.status === 200) {
                    const { user, tokens } = response.data;
                    await secure.set('tokens', tokens);

                    set({
                        authenticated: true,
                        user,
                    });
                } else {
                    throw new Error(`Error de autenticación: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('Error en init:', error.message || error);
        } finally {
            set({ initialized: true });
        }
    },

    // Iniciar sesión
    login: async (credentials, user, tokens) => {
        try {
            await secure.set('credentials', credentials);
            await secure.set('tokens', tokens);

            set({
                authenticated: true,
                user,
            });
            console.log('Inicio de sesión exitoso');
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error.message || error);
        }
    },

    // Cerrar sesión
    logout: async () => {
        try {
            await secure.wipe();
            set({
                authenticated: false,
                user: {},
                initialized: true,
            });
        } catch (error) {
            console.error('Error durante el cierre de sesión:', error.message || error);
        }
    },

    socket: null,

    // Conectar WebSocket
    socketConnect: async () => {
        try {
            const tokens = await secure.get('tokens');
            if (!tokens || !tokens.access) {
                console.warn('No se encontraron tokens válidos para WebSocket');
                return;
            }

            const socket = new WebSocket(`ws://${ADDRESS}/ws/chat/?token=${tokens.access}`);

            socket.onopen = () => {
                console.log('WebSocket conectado');
            };

            socket.onmessage = (event) => {
                console.log('Mensaje recibido:', event.data);
            };

            socket.onerror = (error) => {
                console.error('Error en WebSocket:', error.message || error);
                set({ socket: null });
            };

            socket.onclose = (event) => {
                console.log(`WebSocket cerrado: ${event.reason || 'Conexión cerrada'}`);
                set({ socket: null });
            };

            set({ socket });
        } catch (error) {
            console.error('Error al conectar WebSocket:', error.message || error);
        }
    },

    // Cerrar WebSocket
    socketClose: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null });
        }
    },
}));

export default useGlobal;








