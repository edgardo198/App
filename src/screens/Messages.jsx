import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  SafeAreaView,
  View,
  FlatList,
  Modal,
  Image,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Notifications from 'expo-notifications';
import debounce from 'lodash/debounce';
import MessageInput from '../components/Message/MessageInput';
import MessageBubble from '../components/Message/MessageBubble';
import DismissKeyboardView from '../common/DismissKeyboardView';
import WebBackButton from '../common/WebBackButton';
import api from '../core/api';
import useRecording from '../core/useRecording';
import { registerForPushNotificationsAsync } from '../core/notifications';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';

const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
};

function sanitizeFilename(name, fallbackName) {
  const candidate = (name || fallbackName || '').trim();
  if (!candidate) {
    return fallbackName;
  }

  return candidate.replace(/[^\w.\-]/g, '_');
}

function getExtension(name) {
  const value = String(name || '').split('.').pop()?.toLowerCase();
  return value && value !== name ? value : '';
}

function inferMimeType(filename, fallbackMimeType) {
  const extension = getExtension(filename);
  return MIME_BY_EXTENSION[extension] || fallbackMimeType || 'application/octet-stream';
}

function replaceExtension(filename, nextExtension) {
  const safeName = sanitizeFilename(filename, `file.${nextExtension}`);
  if (safeName.includes('.')) {
    return safeName.replace(/\.[^.]+$/, `.${nextExtension}`);
  }

  return `${safeName}.${nextExtension}`;
}

const MessagesScreen = ({ navigation, route }) => {
  const isWeb = Platform.OS === 'web';
  const [message, setMessage] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const flatListRef = useRef();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const {
    messagesList,
    messagesNext,
    messageList,
    messageSend,
    messageType,
    clearMessages,
    ingestMessagePayload,
    openMessagesThread,
    socketConnected,
  } = useGlobal((state) => state);

  const connectionId = route?.params?.id;
  const friend = route.params.friend;

  useEffect(() => {
    clearMessages && clearMessages();
    openMessagesThread && openMessagesThread(friend?.username);
  }, [clearMessages, friend?.username, openMessagesThread]);

  useEffect(() => {
    if (connectionId && socketConnected) {
      messageList(connectionId);
    }
  }, [connectionId, messageList, socketConnected]);

  const debouncedType = useCallback(
    debounce(() => messageType(friend.username), 300),
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
    if (isWeb) {
      return;
    }

    (async () => {
      const token = await registerForPushNotificationsAsync();
      token && console.log('Push token', token);
    })();
  }, [isWeb]);

  useEffect(() => {
    if (isWeb) {
      return;
    }

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
  }, [friend, isWeb, messagesList]);

  const onSendMessage = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    messageSend(connectionId, trimmed);
    setMessage('');
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [connectionId, message, messageSend]);

  const ensureMediaPermission = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitas dar acceso a tus archivos multimedia.');
      return false;
    }
    return true;
  }, []);

  const getFilenameFromUri = useCallback((uri, fallbackName) => {
    const parsed = uri?.split('/').pop();
    return sanitizeFilename(parsed, fallbackName);
  }, []);

  const handleUnavailableMediaAction = useCallback(() => {
    if (isWeb) {
      Alert.alert(
        'Funcion en progreso',
        'El chat web ya permite iniciar sesion y enviar texto. El envio multimedia sigue disponible principalmente en movil.'
      );
    }
  }, [isWeb]);

  const uploadMediaMessage = useCallback(
    async ({ type, file, fallbackName, fallbackMimeType, errorMessage }) => {
      const uri = file?.uri;
      if (!connectionId || !uri) {
        Alert.alert('Error', errorMessage);
        return false;
      }

      const filename = sanitizeFilename(
        file.fileName || file.name,
        fallbackName || `archivo-${Date.now()}`
      );

      const formData = new FormData();
      formData.append('connectionId', String(connectionId));
      formData.append('type', type);
      formData.append('file', {
        uri,
        name: filename,
        type: file.mimeType || inferMimeType(filename, fallbackMimeType),
      });

      setIsUploadingMedia(true);

      try {
        const response = await api.post('/chat/messages/media/', formData);
        if (response?.data) {
          ingestMessagePayload(response.data);
        }
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        return true;
      } catch (error) {
        const detail = error.response?.data?.detail;
        Alert.alert('Error', detail || errorMessage);
        console.error(`Error enviando ${type}:`, error.response?.data || error.message || error);
        return false;
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [connectionId, ingestMessagePayload]
  );

  const onSendImage = useCallback(async () => {
    if (isWeb) {
      handleUnavailableMediaAction();
      return;
    }

    if (!(await ensureMediaPermission())) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const baseFilename = asset.fileName || getFilenameFromUri(asset.uri, `image-${Date.now()}.jpg`);
      const optimized = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      await uploadMediaMessage({
        type: 'image',
        file: {
          uri: optimized.uri,
          fileName: replaceExtension(baseFilename, 'jpg'),
          mimeType: 'image/jpeg',
        },
        fallbackName: `image-${Date.now()}.jpg`,
        fallbackMimeType: 'image/jpeg',
        errorMessage: 'No se pudo enviar la imagen.',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo preparar la imagen.');
      console.error('Error preparando imagen:', error?.message || error);
    }
  }, [
    ensureMediaPermission,
    getFilenameFromUri,
    handleUnavailableMediaAction,
    isWeb,
    uploadMediaMessage,
  ]);

  const onSendVideo = useCallback(async () => {
    if (isWeb) {
      handleUnavailableMediaAction();
      return;
    }

    if (!(await ensureMediaPermission())) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      await uploadMediaMessage({
        type: 'video',
        file: {
          uri: asset.uri,
          fileName: asset.fileName || getFilenameFromUri(asset.uri, `video-${Date.now()}.mp4`),
          mimeType: asset.mimeType || 'video/mp4',
        },
        fallbackName: `video-${Date.now()}.mp4`,
        fallbackMimeType: 'video/mp4',
        errorMessage: 'No se pudo enviar el video.',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo preparar el video.');
      console.error('Error preparando video:', error?.message || error);
    }
  }, [
    ensureMediaPermission,
    getFilenameFromUri,
    handleUnavailableMediaAction,
    isWeb,
    uploadMediaMessage,
  ]);

  const onSendDocument = useCallback(async () => {
    if (isWeb) {
      handleUnavailableMediaAction();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      await uploadMediaMessage({
        type: 'document',
        file: {
          uri: asset.uri,
          fileName: asset.name || getFilenameFromUri(asset.uri, `document-${Date.now()}`),
          mimeType: asset.mimeType || inferMimeType(asset.name, 'application/octet-stream'),
        },
        fallbackName: `document-${Date.now()}`,
        fallbackMimeType: 'application/octet-stream',
        errorMessage: 'No se pudo enviar el documento.',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo preparar el documento.');
      console.error('Error preparando documento:', error?.message || error);
    }
  }, [getFilenameFromUri, handleUnavailableMediaAction, isWeb, uploadMediaMessage]);

  const onSendAudio = useCallback(async () => {
    if (isWeb) {
      handleUnavailableMediaAction();
      return;
    }

    try {
      if (!isRecording) {
        await startRecording();
        return;
      }

      const audioFile = await stopRecording();
      if (!audioFile?.uri) {
        Alert.alert('Error', 'No se pudo obtener el audio grabado.');
        return;
      }

      await uploadMediaMessage({
        type: 'audio',
        file: audioFile,
        fallbackName: `audio-${Date.now()}.m4a`,
        fallbackMimeType: 'audio/mp4',
        errorMessage: 'No se pudo enviar el audio.',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el audio.');
      console.error('Error enviando audio:', error?.message || error);
    }
  }, [
    handleUnavailableMediaAction,
    isRecording,
    isWeb,
    startRecording,
    stopRecording,
    uploadMediaMessage,
  ]);

  const openFullScreenImage = useCallback((uri) => setFullScreenImage(uri), []);
  const closeFullScreenImage = useCallback(() => setFullScreenImage(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <WebBackButton navigation={navigation} fallbackRoute="Home" style={styles.backButton} />
        <Miniatura url={friend?.miniatura} size={42} />
        <Text style={styles.headerText}>{friend?.name}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <DismissKeyboardView style={styles.inner}>
          <FlatList
            ref={flatListRef}
            data={Array.isArray(messagesList) ? messagesList : []}
            inverted
            contentContainerStyle={styles.messageList}
            keyExtractor={(item, index) => String(item?.id ?? index)}
            onEndReached={() => messagesNext && messageList(connectionId, messagesNext)}
            renderItem={({ item, index }) => (
              <MessageBubble
                index={index}
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
              onImage={onSendImage}
              onAudio={onSendAudio}
              onVideo={onSendVideo}
              onDocument={onSendDocument}
              isRecording={isRecording}
              disabled={isUploadingMedia}
            />
          </View>

          {fullScreenImage && (
            <Modal visible transparent animationType="fade" onRequestClose={closeFullScreenImage}>
              <View style={styles.fullScreenContainer}>
                <Image style={styles.fullScreenImage} source={{ uri: fullScreenImage }} />
              </View>
            </Modal>
          )}
        </DismissKeyboardView>
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
  backButton: { marginRight: 12 },
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
    alignItems: 'center',
  },
  fullScreenImage: { width: '100%', height: '100%', resizeMode: 'contain' },
});

export default MessagesScreen;
