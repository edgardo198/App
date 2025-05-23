import React, { useRef, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View, Text, TouchableOpacity, StyleSheet, Animated, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio, Video } from 'expo-av';
import Cell from '../common/Cell';
import Empty from '../common/Empty';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';
import { formatTime } from '../core/utils';

const styles = StyleSheet.create({
  miniaturaContainer: {
    position: 'relative',
    width: 76,
    height: 76,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202020',
  },
  previewText: {
    fontSize: 14,
    color: '#404040',
  },
  timeText: {
    fontSize: 12,
    color: '#909090',
  },
  mediaPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginTop: 4,
  },
});

const FriendRow = React.memo(
  ({ item }) => {
    const navigation = useNavigation();
    const blinkAnim = useRef(new Animated.Value(1)).current;
    const { friend, message, unreadCount, updated, preview, isNew } = item;
    const [currentPreview, setCurrentPreview] = useState(preview);

    useEffect(() => {
      if (!message) return;

      switch (message.type) {
        case 'image':
          if (message.content) {
            setCurrentPreview(
              <Image source={{ uri: message.content }} style={styles.mediaPreview} />
            );
          }
          break;
        case 'audio':
          if (message.content) {
            setCurrentPreview(
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const { sound } = await Audio.Sound.createAsync({ uri: message.content });
                    await sound.playAsync();
                  } catch (error) {
                    console.log('Error al reproducir audio:', error);
                  }
                }}
              >
                <Text style={styles.previewText}>🎵 Mensaje de voz</Text>
              </TouchableOpacity>
            );
          }
          break;
        case 'video':
          if (message.content) {
            setCurrentPreview(
              <Video
                source={{ uri: message.content }}
                style={styles.mediaPreview}
                useNativeControls
                resizeMode="cover"
                isLooping
              />
            );
          }
          break;
        case 'document':
          if (message.content) {
            setCurrentPreview(
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Linking.openURL(message.content);
                  } catch (error) {
                    console.log('Error al abrir el documento:', error);
                  }
                }}
              >
                <Text style={styles.previewText}>📄 Documento</Text>
              </TouchableOpacity>
            );
          }
          break;
        default:
          setCurrentPreview(message.text || preview);
      }
    }, [message, preview]);

    useEffect(() => {
      if (unreadCount > 0) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, {
              toValue: 0.5,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(blinkAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        blinkAnim.setValue(1);
      }
    }, [unreadCount]);

    const handlePress = () => {
      useGlobal.getState().markFriendAsRead(friend.username);
      navigation.navigate('Messages', item);
    };

    return (
      <TouchableOpacity onPress={handlePress}>
        <Cell>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
            <View style={styles.miniaturaContainer}>
              <Miniatura url={friend.miniatura} size={76} />
              {message && !message.is_me && isNew && (
                <Animated.View style={[styles.unreadBadge, { opacity: blinkAnim }]}>  
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </Animated.View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.nameText}>{friend.name}</Text>
              {typeof currentPreview === 'string' ? (
                <Text style={styles.previewText}>{currentPreview}</Text>
              ) : (
                currentPreview
              )}
              <Text style={styles.timeText}>{formatTime(updated)}</Text>
            </View>
          </View>
        </Cell>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.updated === next.item.updated &&
    prev.item.preview === next.item.preview &&
    prev.item.message?.content === next.item.message?.content &&
    prev.item.friend.miniatura === next.item.friend.miniatura &&
    prev.item.friend.name === next.item.friend.name &&
    prev.item.unreadCount === next.item.unreadCount &&
    prev.item.isNew === next.item.isNew
);

function FriendsScreen() {
  const friendList = useGlobal((state) => state.friendList);

  if (friendList === null) return <ActivityIndicator style={{ flex: 1 }} />;
  if (friendList.length === 0) return <Empty icon="inbox" message="Sin mensajes" />;

  // Añadir índice al keyExtractor para garantizar unicidad incluso si updated coincide
  const keyExtractor = (item, index) =>
    `${item.friend.username}-${item.updated}-${index}`;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={friendList}
        renderItem={({ item }) => <FriendRow item={item} />}
        keyExtractor={keyExtractor}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

export default FriendsScreen;



