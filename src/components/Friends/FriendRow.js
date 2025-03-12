import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import Cell from '../../common/Cell';
import Miniatura from '../../common/Miniatura';
import { formatTime } from '../../core/utils';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    nameText: {
        fontWeight: 'bold',
        color: '#202020',
        marginBottom: 4,
    },
    previewText: {
        color: '#505050',
    },
    timeText: {
        color: '#909090',
        fontSize: 13,
    },
    newMessageIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
        position: 'absolute',
        top: 10,
        right: 10,
    },
    playButton: {
        marginTop: 4,
        padding: 8,
        backgroundColor: '#007AFF',
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    playButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

const FriendRow = ({ item }) => {
    const navigation = useNavigation();
    const [sound, setSound] = useState(null);

    const handlePress = useCallback(() => {
        navigation.navigate('Messages', item);
    }, [navigation, item]);

    const playAudio = async () => {
        if (item?.audio) {
            const { sound } = await Audio.Sound.createAsync({ uri: item.audio });
            setSound(sound);
            await sound.playAsync();
        }
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <Cell>
                <Miniatura url={item?.friend?.miniatura} size={76} />
                <View style={styles.container}>
                    <Text style={styles.nameText}>{item?.friend?.name || 'Desconocido'}</Text>
                    <Text style={styles.previewText}>
                        {item?.image ? '📷 Imagen' : item?.audio ? '🎵 Audio' : item?.preview || ''}
                        <Text style={styles.timeText}> {formatTime(item?.updated)}</Text>
                    </Text>
                    {item?.audio && (
                        <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                            <Text style={styles.playButtonText}>▶ Reproducir Audio</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {item?.unread && <View style={styles.newMessageIndicator} />}
            </Cell>
        </TouchableOpacity>
    );
};

export default FriendRow;
