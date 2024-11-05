import { create } from 'zustand';
import secure from './secure';
import api from './api';

const useGlobal = create((set) => ({
    initialized: false,
    authenticated: false,
    user: {},

    init: async () => {
        const credentials = await secure.get('credentials');
        if (credentials) {
            try {
                const response = await api({
                    method: 'POST',
                    url: '/chat/signin/',
                    data: {
                        username: credentials.username,
                        password: credentials.password,
                    },
                });
                if (response.status !== 200) {
                    throw new Error('Authentication error');
                }
                const user = response.data.user;
                set({
                    authenticated: true,
                    user: user,
                });
            } catch (error) {
                console.log('useGlobal.init error:', error);
            }
        }
        set({
            initialized: true,
        });
    },

    login: async (credentials, user) => {
        try {
            await secure.set('credentials', credentials);
            set({
                authenticated: true,
                user: user,
            });
        } catch (error) {
            console.error('Error during login:', error);
        }
    },

    logout: async () => {
        try {
            await secure.wipe();
            set({
                authenticated: false,
                user: {},
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    },
}));

export default useGlobal;
