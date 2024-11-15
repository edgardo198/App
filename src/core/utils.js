import { Platform } from 'react-native';

function log(...args) {
    args.forEach((arg) => {
        if (typeof arg === 'object') {
            arg = JSON.stringify(arg, null, 2);
        }
        console.log(`[${Platform.OS}]`, arg);
    });
}

export { log };
