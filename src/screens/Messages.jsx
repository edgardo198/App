import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Modal,
  Image,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import * as Notifications from 'expo-notifications';
import debounce from 'lodash/debounce';
import MessageInput from '../components/Message/MessageInput';
import MessageBubble from '../components/Message/MessageBubble';
import useRecording from '../core/useRecording';
import { registerForPushNotificationsAsync } from '../core/notifications';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';

const MessagesScreen = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const flatListRef = useRef();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const {
    messagesList,
    messagesNext,
    messageList,
    messageSend,
    messageType,
    clearMessages,
  } = useGlobal((state) => state);

  const connectionId = route?.params?.id;
  const friend = route.params.friend;

  useEffect(() => {
    clearMessages && clearMessages();
    connectionId && messageList(connectionId);
  }, [connectionId, friend, clearMessages, messageList]);

  const debouncedType = useCallback(
    debounce((text) => messageType(friend.username), 300),
    [friend.username, messageType]
  );

  const onType = useCallback(
    (text) => {
      setMessage(text);
      debouncedType(text);
    },
    [debouncedType]
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      token && console.log('Push token', token);
    })();
  }, []);

  useEffect(() => {
    const latest = messagesList?.[0];
    if (latest && !latest.is_me) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: friend?.name || 'Nuevo mensaje',
          body: latest.text || '[Contenido multimedia]',
        },
        trigger: null,
      });
    }
  }, [messagesList, friend]);

  const onSendMessage = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    messageSend(connectionId, trimmed);
    setMessage('');
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [connectionId, message, messageSend]);

  const openFullScreenImage = useCallback((uri) => setFullScreenImage(uri), []);
  const closeFullScreenImage = useCallback(() => setFullScreenImage(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <Miniatura url={friend?.miniatura} size={42} />
        <Text style={styles.headerText}>{friend?.name}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <FlatList
              ref={flatListRef}
              data={Array.isArray(messagesList) ? messagesList : []}
              inverted
              contentContainerStyle={styles.messageList}
              // Uso solo del índice para keyExtractor garantiza unicidad
              keyExtractor={(_, index) => index.toString()}
              onEndReached={() => messagesNext && messageList(connectionId, messagesNext)}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  friend={friend}
                  onImagePress={openFullScreenImage}
                />
              )}
            />

            <View style={styles.inputContainer}>
              <MessageInput
                message={message}
                setMessage={onType}
                onSend={onSendMessage}
                onImage={() => {}}
                onAudio={() => {}}
                onVideo={() => {}}
                onDocument={() => {}}
                isRecording={isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
              />
            </View>

            {fullScreenImage && (
              <Modal visible transparent animationType="fade" onRequestClose={closeFullScreenImage}>
                <View style={styles.fullScreenContainer}>
                  <Image style={styles.fullScreenImage} source={{ uri: fullScreenImage }} />
                </View>
              </Modal>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginTop: 20,
  },
  headerText: { marginLeft: 12, fontSize: 20, fontWeight: '600', color: '#333' },
  flex: { flex: 1 },
  inner: { flex: 1 },
  messageList: { paddingTop: 16, paddingHorizontal: 12, paddingBottom: 0 },
  inputContainer: {
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullScreenImage: { width: '100%', height: '100%', resizeMode: 'contain' },
});

export default MessagesScreen;








