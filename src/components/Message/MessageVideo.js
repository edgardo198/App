import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';

const getValidUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const serverUrl = 'http://127.0.0.1:8000';
  return serverUrl + url;
};

const MessageVideo = memo(({ message = {} }) => {
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const downloadVideo = useCallback(async () => {
    if (!message.video) return;
    try {
      setLoading(true);
      const validUrl = getValidUrl(message.video);
      if (!validUrl) throw new Error('URL inválida');

      const fileUri = `${FileSystem.cacheDirectory}${message.id}.mp4`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        setVideoUri(fileUri);
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(validUrl, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      setVideoUri(uri);
    } catch (error) {
      console.error('Error al cargar video:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [message.video, message.id]);

  useEffect(() => {
    downloadVideo();
  }, [downloadVideo]);

  const handleDownload = useCallback(async () => {
    if (!videoUri) return;
    try {
      setLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permiso requerido para guardar el video');

      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert('Éxito', 'Video guardado en la galería');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar video');
    } finally {
      setLoading(false);
    }
  }, [videoUri]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => {}}>
        <View style={styles.container}>
          {loading && <ActivityIndicator size="small" color="#303040" />}
          {hasError && <Ionicons name="warning-outline" size={24} color="red" />}
          {videoUri && (
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
            />
          )}
          <TouchableOpacity style={styles.downloadIconContainer} onPress={handleDownload} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="download-outline" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', margin: 10 },
  container: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  downloadIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 4,
  },
});

export default MessageVideo;
