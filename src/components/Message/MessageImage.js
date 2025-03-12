import React, { useState, useEffect, memo } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import ImageViewing from 'react-native-image-viewing';

const IMAGE_SIZE = 200;
const BORDER_RADIUS = 10;
const BACKGROUND_COLOR = '#e0e0e0';
const SPINNER_COLOR = '#303040';

// Función auxiliar para validar y construir una URL completa
const getValidUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Ajusta la URL base a la de tu servidor
  const serverUrl = 'http://192.168.0.111:8000';
  return serverUrl + url;
};

const MessageImage = memo(({ message = {} }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const downloadImage = async () => {
      if (!message.image) return;

      try {
        // Validamos la URL para asegurarnos de que tenga un esquema (http://)
        const validUrl = getValidUrl(message.image);
        if (!validUrl) {
          throw new Error('URL de imagen inválida');
        }
        const fileUri = FileSystem.cacheDirectory + `${message.id}.jpg`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          console.log('Usando imagen en caché...');
          setImageUri(fileUri);
          return;
        }

        console.log('Descargando imagen...');
        const downloadResumable = FileSystem.createDownloadResumable(
          validUrl,
          fileUri
        );
        const { uri } = await downloadResumable.downloadAsync();

        const optimizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        await FileSystem.moveAsync({ from: optimizedImage.uri, to: fileUri });
        setImageUri(fileUri);
      } catch (error) {
        console.error('Error descargando la imagen:', error);
        setHasError(true);
      }
    };

    downloadImage();
  }, [message.image, message.id]);

  const handleDownload = async () => {
    if (!imageUri) return;
    
    try {
      setDownloadLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permiso denegado.');

      await MediaLibrary.saveToLibraryAsync(imageUri);
      alert('Imagen guardada en galería!');
    } catch (error) {
      alert(error.message || 'Error al descargar la imagen.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => setIsVisible(true)}>
        <View style={styles.container}>
          {!loaded && !hasError && <ActivityIndicator size="small" color={SPINNER_COLOR} />}
          {hasError && <Text style={styles.errorText}>Error al cargar imagen</Text>}
          {imageUri && (
            <Image
              style={styles.image}
              source={{ uri: imageUri }}
              resizeMode="cover"
              onLoadEnd={() => setLoaded(true)}
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

      <ImageViewing
        images={[{ uri: imageUri }]}
        imageIndex={0}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', margin: 10 },
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
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: BORDER_RADIUS, position: 'absolute' },
  errorText: { color: 'red' },
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






