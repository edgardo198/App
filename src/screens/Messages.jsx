import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Modal,
  Image,
  useColorScheme,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import debounce from 'lodash/debounce';
import MessageHeader from '../components/Message/MessageHeader';
import MessageInput from '../components/Message/MessageInput';
import MessageBubble from '../components/Message/MessageBubble';
import useRecording from '../core/useRecording';
import { registerForPushNotificationsAsync } from '../core/notifications';
import useGlobal from '../core/global';

const MessagesScreen = ({ navigation, route }) => {
  const [message, setMessage] = useState('');
  const [pushToken, setPushToken] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Estado global: actualizado vía WebSocket en tiempo real.
  const messagesList = useGlobal((state) => state.messagesList);
  const messagesNext = useGlobal((state) => state.messagesNext);
  const messageList = useGlobal((state) => state.messageList);
  const messageSend = useGlobal((state) => state.messageSend);
  const messageSendImage = useGlobal((state) => state.messageSendImage);
  const messageSendAudio = useGlobal((state) => state.messageSendAudio);
  const messageType = useGlobal((state) => state.messageType);
  const clearMessages = useGlobal((state) => state.clearMessages);

  const connectionId = route?.params?.id;
  const friend = route.params.friend;
  const flatListRef = useRef();
  const theme = useColorScheme();
  const { isRecording, startRecording, stopRecording } = useRecording();

  // Al cambiar de conversación, limpiar el estado global y cargar los mensajes.
  useEffect(() => {
    if (clearMessages) clearMessages();
    if (connectionId) messageList(connectionId);
  }, [connectionId, friend, clearMessages, messageList]);

  // Enviar evento de tipeo con debounce
  const debouncedType = useCallback(
    debounce((value) => {
      messageType(friend.username);
    }, 300),
    [friend.username, messageType]
  );

  const onType = useCallback(
    (value) => {
      setMessage(value);
      debouncedType(value);
    },
    [debouncedType]
  );

  // Actualiza el header con la información del amigo
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <MessageHeader friend={friend} />,
    });
  }, [friend, navigation]);

  // Registro de notificaciones push
  useEffect(() => {
    const registerPush = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        console.log('Push token registered:', token);
      }
    };
    registerPush();
  }, []);

  // Notificación local para mensajes entrantes (para el receptor)
  useEffect(() => {
    const newMessage = messagesList?.[0];
    if (newMessage && !newMessage.is_me) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: friend?.name || 'Nuevo mensaje',
          body:
            newMessage.text ||
            (newMessage.image ? '[Imagen]' : newMessage.audio ? '[Audio]' : ''),
          data: { messageId: newMessage.id },
        },
        trigger: null,
      });
    }
  }, [messagesList, friend]);

  // Envío de mensaje de texto
  const onSend = useCallback(() => {
    const cleaned = message.trim();
    if (!cleaned) return;

    // Enviar mensaje a través del WebSocket
    messageSend(connectionId, cleaned);
    // Limpiar campo de entrada
    setMessage('');
    // Opcional: desplazar la lista para mostrar el mensaje más reciente
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [connectionId, message, messageSend]);

  // Envío de imagen
  const handleImagePick = useCallback(async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64 = `data:image/jpg;base64,${result.assets[0].base64}`;
        messageSendImage(connectionId, base64, 'image.jpg');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, [connectionId, messageSendImage]);

  // Envío de audio
  const handleAudioPress = useCallback(async () => {
    if (isRecording) {
      const base64 = await stopRecording();
      if (base64) {
        messageSendAudio(connectionId, base64, 'audio.m4a');
      }
    } else {
      await startRecording();
    }
  }, [isRecording, connectionId, startRecording, stopRecording, messageSendAudio]);

  const openFullScreenImage = useCallback((imageUri) => {
    setFullScreenImage(imageUri);
  }, []);

  const closeFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingTop: 30 }}
          data={Array.isArray(messagesList) ? messagesList : []}
          inverted
          keyExtractor={(item, index) =>
            item && item.id != null ? item.id.toString() : `item-${index}`
          }
          onEndReached={() => {
            if (messagesNext) messageList(connectionId, messagesNext);
          }}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              friend={friend}
              onImagePress={openFullScreenImage}
            />
          )}
        />
      </View>
      <MessageInput
        message={message}
        setMessage={onType}
        onSend={onSend}
        onImage={handleImagePick}
        onAudio={handleAudioPress}
        isRecording={isRecording}
      />
      {fullScreenImage && (
        <Modal
          visible={fullScreenImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFullScreenImage}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              source={{ uri: fullScreenImage }}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default MessagesScreen;


