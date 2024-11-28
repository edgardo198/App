import React, { useState } from 'react';
import { SafeAreaView, TextInput, View, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Empty from '../common/Empty';

function SearchScreen() {
    const [query, setQuery] = useState('');
    const searchList = []; // Simula los resultados de búsqueda

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

            {/* Resultado de búsqueda */}
            {searchList.length === 0 ? (
                <Empty
                    icon={faTriangleExclamation}
                    message={
                        query
                            ? `El usuario ${query} no fue encontrado.`
                            : 'Buscar Amigos'
                    }
                    centered={false}
                />
            ) : (
                <View>
                    <Text>Resultados de búsqueda...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

export default SearchScreen;

