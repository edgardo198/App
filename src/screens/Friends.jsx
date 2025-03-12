import React, { useMemo, useRef, useEffect } from 'react';
import { ActivityIndicator, FlatList, View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
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
  alertIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'green',
    borderWidth: 1,
    borderColor: 'white',
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

    useEffect(() => {
      if (item.unreadCount > 0) {
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
    }, [item.unreadCount, blinkAnim]);

    const handlePress = () => {
      useGlobal.getState().markFriendAsRead(item.friend.username);
      navigation.navigate('Messages', item);
    };

    const renderMessageContent = () => {
      const { message, preview } = item;
      if (!message) return <Text style={styles.previewText}>{preview}</Text>;
      switch (message.type) {
        case 'text':
          return <Text style={styles.previewText}>{message.text || preview}</Text>;
        case 'image':
          return message.content ? (
            <Image source={{ uri: message.content }} style={styles.mediaPreview} />
          ) : null;
        case 'audio':
          return message.content ? (
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
          ) : null;
        default:
          return <Text style={styles.previewText}>{preview}</Text>;
      }
    };

    return (
      <TouchableOpacity onPress={handlePress}>
        <Cell>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
            <View style={styles.miniaturaContainer}>
              <Miniatura url={item.friend.miniatura} size={76} />
              
              {item.unreadCount > 0 && (
                <Animated.View style={[styles.unreadBadge, { opacity: blinkAnim }]}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </Animated.View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.nameText}>{item.friend.name}</Text>
              {renderMessageContent()}
              <Text style={styles.timeText}>{formatTime(item.updated)}</Text>
            </View>
          </View>
        </Cell>
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.updated === next.item.updated &&
    prev.item.preview === next.item.preview &&
    prev.item.friend.miniatura === next.item.friend.miniatura &&
    prev.item.friend.name === next.item.friend.name &&
    prev.item.unreadCount === next.item.unreadCount &&
    prev.item.isNew === next.item.isNew
);

function FriendsScreen() {
  const friendList = useGlobal((state) => state.friendList);
  const memoizedFriendList = useMemo(() => friendList, [friendList]);

  if (friendList === null) return <ActivityIndicator style={{ flex: 1 }} />;
  if (friendList.length === 0) return <Empty icon="inbox" message="Sin mensajes" />;

  // Genera una key única combinando un identificador único y el índice
  const keyExtractor = (item, index) => {
    const uniqueId = item.friend.id || item.friend.username || `unknown-${index}`;
    return `${uniqueId}-${index}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={memoizedFriendList}
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











