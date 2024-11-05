import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import useGlobal from '../core/global';

function ProfileLogout() {
    const logout = useGlobal(state => state.logout)

    return (
        <TouchableOpacity
            onPress={ logout }
            style={{
                flexDirection: 'row',
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 26,
                backgroundColor: '#00a2ed', 
                marginTop: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5, 
            }}
        >
            <FontAwesomeIcon
                icon={'right-from-bracket'}
                size={20}
                color='#ffffff'
                style={{ marginRight: 12 }}
            />
            <Text
                style={{
                    fontWeight: 'bold',
                    color: '#ffffff',
                    fontSize: 16,
                }}
            >
                Cerrar Sesion
            </Text>
        </TouchableOpacity>
    );
}

function ProfileScreen() {
    return (
        <View
            style={{
                flex: 1,
                alignItems: 'center',
                paddingTop: 80,
                backgroundColor: '#e6f7ff', 
            }}
        >
            <Image
                source={require('../assets/kisspng-portable-.png')}
                style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    backgroundColor: '#cceeff', 
                    marginBottom: 16,
                    borderWidth: 3,
                    
                }}
            />
            <Text
                style={{
                    textAlign: 'center',
                    color: '#0078d4', 
                    fontSize: 24,
                    fontWeight: 'bold',
                    marginTop: 8,
                }}
            >
                Edgardo Ortega
            </Text>
            <Text
                style={{
                    textAlign: 'center',
                    color: '#6ba4c8', 
                    fontSize: 16,
                    marginTop: 4,
                }}
            >
                Tato
            </Text>
            <ProfileLogout />
        </View>
    );
}

export default ProfileScreen;

