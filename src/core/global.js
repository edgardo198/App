import { create } from 'zustand';
import secure from './secure'; // Importar el módulo de almacenamiento seguro
import api from './api';       // Importar la configuración de Axios
import utils from './utils';   // Utilidades adicionales

const useGlobal = create((set) => ({
    initialized: false,
    authenticated: false,
    user: {},

    // Función para inicializar la autenticación
    init: async () => {
        console.log("Iniciando el proceso de autenticación...");

        // Obtener credenciales almacenadas
        const credentials = await secure.get('credentials');
        console.log("Credenciales obtenidas de secure:", credentials);

        if (credentials) {
            try {
                // Realizar solicitud de inicio de sesión
                const response = await api.post('/chat/signin/', {
                    username: credentials.username,
                    password: credentials.password,
                });

                console.log("Respuesta completa de la API:", response); // Log para ver toda la respuesta

                if (response.status !== 200) {
                    throw new Error('Error de autenticación: Estado diferente de 200');
                }

                // Destructura la respuesta para asegurar que contiene `user` y `tokens`
                const { user, tokens } = response.data;
                await secure.set('tokens', tokens);
                console.log("Tokens almacenados correctamente en secure.");

                // Actualizar estado en zustand
                set({
                    authenticated: true,
                    user,
                });
            } catch (error) {
                console.log('Error en useGlobal.init:', error);
            }
        } else {
            console.log("No se encontraron credenciales almacenadas en secure.");
        }

        set({ initialized: true });
    },

    // Función para realizar login
    login: async (credentials, user, tokens) => {
        try {
            console.log("Guardando credenciales y tokens en secure...");
            await secure.set('credentials', credentials);
            await secure.set('tokens', tokens);

            set({
                authenticated: true,
                user,
            });
            console.log("Login exitoso: authenticated = true");
        } catch (error) {
            console.error('Error durante el login:', error);
        }
    },

    // Función para realizar logout
    logout: async () => {
        try {
            console.log("Borrando datos de autenticación...");
            await secure.wipe(); // Llama a wipe para borrar 'credentials' y 'tokens'
            set({
                authenticated: false,
                user: {},
                initialized: true,
            });
        } catch (error) {
            console.error('Error durante el logout:', error);
        }
    },

    socket: null,

    // Función para conectar WebSocket
    socketConnect: async () => {
        const tokens = await secure.get('tokens');
        console.log("Tokens obtenidos para WebSocket:", tokens);

        if (!tokens || !tokens.access) {
            console.error('No se encontraron tokens válidos para la conexión WebSocket');
            return;
        }

        utils.log('Token de acceso para WebSocket:', tokens.access);

        try {
            const socket = new WebSocket(`ws://${ADDRESS}/chat/?token=${tokens.access}`);

            socket.onopen = () => {
                utils.log('WebSocket conectado');
            };

            socket.onmessage = (event) => {
                utils.log('Mensaje recibido:', event.data);
            };

            socket.onerror = (error) => {
                utils.log('Error en WebSocket:', error.message);
            };

            socket.onclose = (event) => {
                utils.log(`WebSocket cerrado: ${event.reason || 'Conexión cerrada'}`);
                set({ socket: null });
            };

            set({ socket });
        } catch (error) {
            console.error('Error al establecer la conexión WebSocket:', error);
        }
    },

    // Función para cerrar WebSocket
    socketClose: () => {
        const { socket } = useGlobal.getState();
        if (socket) {
            socket.close();
            utils.log('Conexión WebSocket cerrada por el cliente');
            set({ socket: null });
        }
    },
}));

export default useGlobal;








