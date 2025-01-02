import React, { useEffect, useState } from 'react';
import { SafeAreaView, TextInput, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import Empty from '../common/Empty';
import Miniatura from '../common/Miniatura';
import useGlobal from '../core/global';
import Cell from '../common/Cell';

function SearchButton({ user }) {
    console.log('User status:', user.status);
    
    const requestConnect = useGlobal(state => state.requestConnect);

    if(user.status==='connected'){
        return(
            <FontAwesomeIcon
                icon='circle-check'
                size={40}
                color='#20d080'
                style={{
                    margin: 10
                }}

            />
        )
    }


    const data = {
        text: '',
        disabled: false,
        onPress: () => {}
    };

    switch (user.status) {
        case 'no-connection':
            data.text = 'Conectar';
            data.disabled = false;
            data.onPress = () => {
                requestConnect(user.username);
            };
            break;

        case 'pending-them':
            data.text = 'Pendiente';
            data.disabled = true;
            break;

        case 'pending-me':
            data.text = 'Aceptar';
            data.disabled = false;
            data.onPress = () => {
                requestConnect(user.username);
            };
            break;

        default:
            break;
    }

    return (
        <TouchableOpacity
            style={{
                backgroundColor: data.disabled ? '#505050' : '#202020',
                paddingHorizontal: 14,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
            }}
            onPress={data.disabled ? null : data.onPress} 
            disabled={data.disabled} 
        >
            <Text
                style={{
                    color: data.disabled ? '#808080' : 'white',
                    fontWeight: 'bold',
                }}
            >
                {data.text}
            </Text>
        </TouchableOpacity>
    );
}

function SearchRow({ user }) {
    return (
        <Cell>
            <Miniatura url={user.miniatura} size={76} />
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: 16,
                }}
            >
                <Text
                    style={{
                        fontWeight: 'bold',
                        color: '#202020',
                        marginBottom: 4,
                    }}
                >
                    {user.name}
                </Text>
                <Text
                    style={{
                        color: '#202020',
                    }}
                >
                    {user.username}
                </Text>
            </View>
            <SearchButton user={user} />
        </Cell>
    );
}

function SearchScreen() {
    const [query, setQuery] = useState('');
    const searchList = useGlobal((state) => state.searchList) || [];
    const searchUsers = useGlobal((state) => state.searchUsers);

    useEffect(() => {
        searchUsers(query);
    }, [query]);

    const styles = {
        container: { flex: 1 },
        searchBarContainer: {
            padding: 16,
            borderBottomWidth: 1,
            borderColor: '#f0f0f0',
        },
        searchInputContainer: { position: 'relative' },
        searchInput: {
            backgroundColor: '#e1e2e3',
            height: 52,
            borderRadius: 26,
            padding: 16,
            fontSize: 16,
            paddingLeft: 50,
        },
        iconStyle: {
            position: 'absolute',
            left: 16,
            top: 16,
        },
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Barra de búsqueda */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Buscar"
                        placeholderTextColor="#b0b0b0"
                        accessibilityLabel="Barra de búsqueda"
                    />
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        size={20}
                        color="#505050"
                        style={styles.iconStyle}
                        accessibilityLabel="Ícono de búsqueda"
                    />
                </View>
            </View>

            {!searchList.length ? (
                <Empty
                    icon={faMagnifyingGlass}
                    message={query ? `El usuario ${query} no fue encontrado.` : 'Buscar Amigos'}
                    centered={false}
                />
            ) : (
                <FlatList
                    data={searchList}
                    renderItem={({ item }) => <SearchRow user={item} />}
                    keyExtractor={(item) => item.username}
                />
            )}
        </SafeAreaView>
    );
}

export default SearchScreen;


