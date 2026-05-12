import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  Platform,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import ImageViewer from './ImageViewer';
import { resolveMediaUrl } from '../../core/api';

const IMAGE_SIZE = 200;
const BORDER_RADIUS = 10;
const BACKGROUND_COLOR = '#e0e0e0';
const SPINNER_COLOR = '#303040';

const getValidUrl = (url) => {
  if (!url) return null;
  return resolveMediaUrl(url);
};

const MessageImage = memo(({ message = {} }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const downloadImage = useCallback(async () => {
    if (!message.image) return;

    try {
      const validUrl = getValidUrl(message.image);
      if (!validUrl) {
        throw new Error('URL invalida');
      }

      if (Platform.OS === 'web') {
        setImageUri(validUrl);
        setLoaded(true);
        return;
      }

      const urlParts = validUrl.split('.');
      const originalExtension = urlParts.pop().toLowerCase();
      const isAnimated = originalExtension === 'gif';

      const fileUri = `${FileSystem.cacheDirectory}${message.id}.${originalExtension}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        setImageUri(fileUri);
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(validUrl, fileUri);
      const { uri } = await downloadResumable.downloadAsync();

      if (!isAnimated) {
        const optimizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        await FileSystem.moveAsync({ from: optimizedImage.uri, to: fileUri });
      }

      setImageUri(fileUri);
    } catch (error) {
      console.error('Error al cargar imagen:', error);
      setHasError(true);
    }
  }, [message.id, message.image]);

  useEffect(() => {
    downloadImage();
  }, [downloadImage]);

  const handleDownload = useCallback(async () => {
    if (!imageUri) return;

    try {
      setDownloadLoading(true);

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = `imagen-${message.id || 'chat'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso requerido para guardar la imagen');
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      Alert.alert('Exito', 'Imagen guardada en la galeria');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar imagen');
    } finally {
      setDownloadLoading(false);
    }
  }, [imageUri, message.id]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => setIsVisible(true)}>
        <View style={styles.container}>
          {!loaded && !hasError && <ActivityIndicator size="small" color={SPINNER_COLOR} />}
          {hasError && <Text style={styles.errorText}>Error al cargar imagen</Text>}
          {imageUri && (
            <ExpoImage
              style={styles.image}
              source={{ uri: imageUri }}
              contentFit="cover"
              transition={1000}
              onLoad={() => setLoaded(true)}
              onError={() => {
                setHasError(true);
                setLoaded(true);
              }}
            />
          )}
          {loaded && !hasError && (
            <TouchableOpacity
              style={styles.downloadIconContainer}
              onPress={handleDownload}
              disabled={downloadLoading}
            >
              {downloadLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <ImageViewer
        images={[{ uri: imageUri }]}
        imageIndex={0}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
        animationType="fade"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    margin: 10,
  },
  container: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BORDER_RADIUS,
    backgroundColor: BACKGROUND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BORDER_RADIUS,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  downloadIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 4,
  },
});

export default MessageImage;
