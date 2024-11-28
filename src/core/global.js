import { create } from 'zustand';
import { ADDRESS } from './api';
import secure from './secure';
import api from './api';
import { log } from '../core/utils';

const SOURCES = {
    MINIATURA: 'miniatura', // Define esta constante
};

function responseMiniatura(set, get, data) {

    set((state) => ({
        user: data
    }));
    console.log('Miniatura actualizada en el estado:', data);
}

const useGlobal = create((set, get) => ({
    initialized: false,
    authenticated: false,
    user: {},

    init: async () => {
        try {
            const credentials = await secure.get('credentials');
            if (!credentials || !credentials.username || !credentials.password) {
                console.warn('Credenciales inválidas.');
                set({ initialized: true });
                return;
            }

            const response = await api.post('/chat/signin/', credentials);
            if (response?.status === 200) {
                const { user, tokens } = response.data;
                if (user && tokens) {
                    await secure.set('tokens', tokens);
                    set({
                        authenticated: true,
                        user,
                    });
                } else {
                    throw new Error('Datos incompletos en la respuesta.');
                }
            } else {
                throw new Error(`Error de autenticación: ${response.status}`);
            }
        } catch (error) {
            console.error('Error en init:', error.message || error);
        } finally {
            set({ initialized: true });
        }
    },

    login: async (credentials, user, tokens) => {
        try {
            await secure.set('credentials', credentials);
            await secure.set('tokens', tokens);
            set({
                authenticated: true,
                user,
            });
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error.message || error);
        }
    },

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
    socketConnected: false,

    socketConnect: async (retries = 3) => {
        try {
            const tokens = await secure.get('tokens');
            if (!tokens?.access) {
                console.warn('No se encontraron tokens válidos para WebSocket.');
                return;
            }

            const protocol = ADDRESS.startsWith('https') ? 'wss' : 'ws';
            const socket = new WebSocket(`${protocol}://${ADDRESS}/ws/chat/?token=${tokens.access}`);

            socket.onopen = () => {
                console.log('WebSocket conectado.');
                set({ socketConnected: true });
            };

            socket.onmessage = (event) => {
                
                const parsed = JSON.parse(event.data);

                log('onmessage:', parsed)

                const responses= {
                    'miniatura': responseMiniatura
                }
                const resp = responses[parsed.source]
                if(!resp){
                    log('parsed.source "' + parsed.source + '" not found')
                    return
                }
                resp(set, get, parsed.data)       
            };

            socket.onerror = (error) => {
                console.error('Error en WebSocket:', error.message || error);
                set({ socket: null, socketConnected: false });

                if (retries > 0) {
                    console.log(`Reintentando conexión WebSocket (${retries} intentos restantes)...`);
                    setTimeout(() => get().socketConnect(retries - 1), 3000);
                }
            };

            socket.onclose = (event) => {
                console.log(`WebSocket cerrado: ${event.reason || 'Conexión cerrada'}`);
                set({ socket: null, socketConnected: false });

                if (retries > 0) {
                    console.log(`Reintentando conexión WebSocket (${retries} intentos restantes)...`);
                    setTimeout(() => get().socketConnect(retries - 1), 3000);
                }
            };

            set({ socket });
        } catch (error) {
            console.error('Error al conectar WebSocket:', error.message || error);
        }
    },

    socketClose: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
            set({ socket: null, socketConnected: false });
        }
    },

    uploadMiniatura: (file) => {
        const socket = get().socket;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('El WebSocket no está conectado.');
            return;
        }
        socket.send(
            JSON.stringify({
                source: SOURCES.MINIATURA,
                base64: file.base64,
                filename: file.fileName,
            })
        );
    },
}));

export default useGlobal;

