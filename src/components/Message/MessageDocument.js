import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const getValidUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const serverUrl = 'http://127.0.0.1:8000';
  return serverUrl + url;
};

const MessageDocument = memo(({ message = {} }) => {
  const [docUri, setDocUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const downloadDocument = useCallback(async () => {
    if (!message.document) return;
    try {
      setLoading(true);
      const validUrl = getValidUrl(message.document);
      if (!validUrl) throw new Error('URL inválida');

      const fileUri = `${FileSystem.cacheDirectory}${message.id}.pdf`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        setDocUri(fileUri);
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(validUrl, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      setDocUri(uri);
    } catch (error) {
      console.error('Error al cargar documento:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [message.document, message.id]);

  useEffect(() => {
    downloadDocument();
  }, [downloadDocument]);

  const handleOpen = () => {
    if (docUri) {
      Linking.openURL(docUri);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!docUri) return;
    try {
      setLoading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Permiso requerido para guardar el documento');

      await MediaLibrary.saveToLibraryAsync(docUri);
      Alert.alert('Éxito', 'Documento guardado');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al guardar documento');
    } finally {
      setLoading(false);
    }
  }, [docUri]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handleOpen}>
        <View style={styles.container}>
          {loading && <ActivityIndicator size="small" color="#303040" />}
          {hasError && <Ionicons name="warning-outline" size={24} color="red" />}
          <Ionicons name="document-text-outline" size={50} color="#555" />
          <Text style={styles.filename}>{message.filename || 'Documento'}</Text>
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
    height: 100,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filename: { fontSize: 14, marginTop: 5, color: '#333' },
  downloadIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 15,
    padding: 4,
  },
});

export default MessageDocument;
