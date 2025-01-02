import { Platform } from 'react-native';
import { ADDRESS } from '../core/api';

function log(...args) {
    args.forEach(arg => {
        if (typeof arg === 'object') {
            arg = JSON.stringify(arg, null, 2);
        }
        console.log(`[${Platform.OS}]`, arg);
    });
}
function miniatura(url) {
    if (!url) {
        return require('../assets/kisspng-portable-.png');  
    }
    return { uri: 'http://' + ADDRESS + url }; 

}

function formatTime(data) {
    if (data === null) {
        return '_';
    }
    const now = new Date();
    const s = Math.abs(now - new Date(data)) / 1000;

    if (s < 60) {
        return 'ahora';
    }
    if (s < 60 * 60) {
        const m = Math.floor(s / 60);
        return ` ${m}m`;
    }
    if (s < 60 * 60 * 24) {
        const h = Math.floor(s / (60 * 60));
        return ` ${h}h`;
    }
    if (s < 60 * 60 * 24 * 7) {
        const d = Math.floor(s / (60 * 60 * 24));
        return ` ${d}d`;
    }
    if (s < 60 * 60 * 24 * 7 * 4) {
        const w = Math.floor(s / (60 * 60 * 24 * 7));
        return ` ${w}s`;
    }
    const y = Math.floor(s / (60 * 60 * 24 * 365));
    return ` ${y}a`;
}

export { log, miniatura, formatTime };



