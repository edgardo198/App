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

export { log, miniatura };



