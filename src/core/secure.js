import * as SecureStore from 'expo-secure-store';


async function set(key, object) {
    try {
        await SecureStore.setItemAsync(key, JSON.stringify(object));
    } catch (error) {
        console.log('Error en secure.set:', error);
    }
}


async function get(key) {
    try {
        const data = await SecureStore.getItemAsync(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.log('Error en secure.get:', error);
        return null;
    }
}

async function remove(key) {
    try {
        await SecureStore.deleteItemAsync(key);
    } catch (error) {
        console.log('Error en secure.remove:', error);
    }
}


async function wipe() {
    const keysToDelete = ['credentials']; 
    try {
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.log('Error en secure.wipe:', error);
    }
}

export default { set, get, remove, wipe };

