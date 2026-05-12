import React, { useEffect, useState, memo, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { resolveMediaUrl } from '../../core/api';

function getValidUrl(url) {
  return url ? resolveMediaUrl(url) : null;
}

function getSafeFilename(message) {
  return (message.filename || `document-${message.id || 'chat'}`).replace(/[^\w.\-]/g, '_');
}

const MessageDocument = memo(({ message = {} }) => {
  const [docUri, setDocUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const downloadDocument = useCallback(async () => {
    if (!message.document) {
      return;
    }

    try {
      setLoading(true);
      const validUrl = getValidUrl(message.document);
      if (!validUrl) {
        throw new Error('URL invalida');
      }

      if (Platform.OS === 'web') {
        setDocUri(validUrl);
        return;
      }

      const filename = getSafeFilename(message);
      const fileUri = `${FileSystem.cacheDirectory}${message.id}-${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        setDocUri(fileUri);
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(validUrl, fileUri);
      const { uri } = await downloadResumable.downloadAsync();
      setDocUri(uri);
    } catch (error) {
      console.error('Error al cargar documento:', error?.message || error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    downloadDocument();
  }, [downloadDocument]);

  const handleOpen = useCallback(async () => {
    const target = docUri || getValidUrl(message.document);
    if (!target) {
      return;
    }

    try {
      await Linking.openURL(target);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el documento.');
    }
  }, [docUri, message.document]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handleOpen}>
        <View style={styles.container}>
          {loading && <ActivityIndicator size="small" color="#303040" />}
          {hasError && <Ionicons name="warning-outline" size={24} color="red" />}
          <Ionicons name="document-text-outline" size={50} color="#555" />
          <Text style={styles.filename} numberOfLines={2}>
            {message.filename || 'Documento'}
          </Text>
          <TouchableOpacity
            style={styles.downloadIconContainer}
            onPress={handleOpen}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={16} color="#fff" />
            )}
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
    minHeight: 100,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filename: {
    fontSize: 14,
    marginTop: 5,
    color: '#333',
    textAlign: 'center',
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

export default MessageDocument;
