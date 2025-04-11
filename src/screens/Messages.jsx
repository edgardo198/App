import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Modal,
  Image,
  Text,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import debounce from 'lodash/debounce';
import MessageHeader from '../components/Message/MessageHeader';
import MessageInput from '../components/Message/MessageInput';
import MessageBubble from '../components/Message/MessageBubble';
import useRecording from '../core/useRecording';
import { registerForPushNotificationsAsync } from '../core/notifications';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';

const MessagesScreen = ({ navigation, route }) => {
  // Estados locales
  const [message, setMessage] = useState('');
  const [pushToken, setPushToken] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Referencias y hooks globales
  const flatListRef = useRef();
  const theme = useColorScheme();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const {
    messagesList,
    messagesNext,
    messageList,
    messageSend,
    messageSendImage,
    messageSendAudio,
    messageSendVideo,
    messageSendDocument,
    messageType,
    clearMessages,
  } = useGlobal((state) => state);

  const connectionId = route?.params?.id;
  const friend = route.params.friend;

  // Carga de mensajes y limpieza al cambiar de conversación
  useEffect(() => {
    if (clearMessages) clearMessages();
    if (connectionId) messageList(connectionId);
  }, [connectionId, friend, clearMessages, messageList]);

  // Envío de evento de tipeo con debounce para evitar demasiados eventos
  const debouncedType = useCallback(
    debounce((value) => messageType(friend.username), 300),
    [friend.username, messageType]
  );

  const onType = useCallback(
    (value) => {
      setMessage(value);
      debouncedType(value);
    },
    [debouncedType]
  );

  // Actualización del header con la información del amigo
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

  // Notificación local para mensajes entrantes
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

  // Funciones de envío

  const onSendMessage = useCallback(() => {
    const cleaned = message.trim();
    if (!cleaned) return;
    messageSend(connectionId, cleaned);
    setMessage('');
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [connectionId, message, messageSend]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0].base64) {
        const base64 = `data:image/jpg;base64,${result.assets[0].base64}`;
        messageSendImage(connectionId, base64, 'image.jpg');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }, [connectionId, messageSendImage]);

  const pickVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Selección de videos
        allowsEditing: false,
        quality: 1,
        base64: false, // No se solicita base64 directo para videos
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        // Lee el archivo desde la URI y conviértelo a base64
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Determina la extensión y tipo MIME (ajusta si usas otro formato)
        const extension = result.assets[0].uri.split('.').pop();
        const mimeType = `video/${extension === 'mov' ? 'quicktime' : 'mp4'}`;
        // Crea el Data URI de forma similar a como se hace con imágenes
        const dataUri = `data:${mimeType};base64,${base64}`;
        console.log('Video seleccionado:', { uri: result.assets[0].uri, dataUri });
        // Envía el video utilizando la función global correspondiente
        messageSendVideo(connectionId, dataUri, `video.${extension}`);
      } else {
        console.log('No se seleccionó un video o se canceló la operación');
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  }, [connectionId, messageSendVideo]);
  
  const pickDocument = useCallback(async () => {
    console.log("Iniciando selección de documento...");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Permite cualquier tipo de archivo
        copyToCacheDirectory: true,
      });
      console.log("Resultado del DocumentPicker:", result);
      
      // Verifica que no se haya cancelado y que haya al menos un asset
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Usa la información del primer asset
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        const mimeType = result.assets[0].mimeType || 'application/octet-stream';
        
        // Verifica que el archivo exista
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        console.log("Información del archivo:", fileInfo);
        if (!fileInfo.exists) {
          console.warn("El archivo seleccionado no existe en el sistema de archivos.");
          return;
        }
        
        // Lee el archivo en base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Crea el Data URI para el documento
        const dataUri = `data:${mimeType};base64,${base64}`;
        
        // Log para verificar los datos (muestra los primeros 100 caracteres del Data URI)
        console.log('Documento seleccionado:', {
          uri: fileUri,
          dataUri: dataUri.substring(0, 100) + '...',
          name: fileName,
        });
        
        // Envía el documento utilizando la función global correspondiente
        messageSendDocument(connectionId, dataUri, fileName);
      } else {
        console.log('Operación cancelada o fallo en la selección del documento');
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  }, [connectionId, messageSendDocument]);
    
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

  // Manejo de imagen a pantalla completa
  const openFullScreenImage = useCallback((uri) => {
    setFullScreenImage(uri);
  }, []);

  const closeFullScreenImage = useCallback(() => {
    setFullScreenImage(null);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Cabecera del chat */}
      <View style={styles.topUserContainer}>
        <Miniatura url={friend?.miniatura} size={42} />
        <Text style={styles.topUserName}>{friend?.name}</Text>
      </View>

      {/* Lista de mensajes */}
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

      {/* Componente de input de mensaje con menú desplegable para medios */}
      <MessageInput
        message={message}
        setMessage={onType}
        onSend={onSendMessage}
        onImage={pickImage}
        onAudio={handleAudioPress}
        onVideo={pickVideo}
        onDocument={pickDocument}
        isRecording={isRecording}
      />

      {/* Modal para ver imagen en pantalla completa */}
      {fullScreenImage && (
        <Modal
          visible={fullScreenImage !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={closeFullScreenImage}
        >
          <View style={styles.fullScreenContainer}>
            <Image
              style={styles.fullScreenImage}
              source={{ uri: fullScreenImage }}
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  topUserName: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default MessagesScreen;





