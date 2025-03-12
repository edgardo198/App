import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import styles from '../../Styles/audioStyles';

// Función auxiliar para validar la URL del audio
const getValidUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Ajusta la URL base según tu servidor
  const serverUrl = 'http://192.168.0.111:8000';
  return serverUrl + url;
};

const AudioPlayer = memo(({ audioUri = '', messageId = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [localUri, setLocalUri] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const downloadAudio = async () => {
      try {
        const validAudioUri = getValidUrl(audioUri);
        if (!validAudioUri) {
          console.error('URL de audio inválida');
          return;
        }
        const fileUri = `${FileSystem.cacheDirectory}audio_${messageId}.m4a`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
          console.log('Descargando audio...');
          const { uri } = await FileSystem.downloadAsync(validAudioUri, fileUri);
          if (isMounted) {
            setLocalUri(uri);
          }
        } else {
          console.log('Usando audio en caché...');
          if (isMounted) {
            setLocalUri(fileUri);
          }
        }
      } catch (error) {
        console.error('Error descargando el audio:', error);
      }
    };

    downloadAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [audioUri, messageId]);

  useEffect(() => {
    if (!localUri) return;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: localUri },
          { shouldPlay: false },
          (playbackStatus) => {
            setStatus(playbackStatus);
            if (playbackStatus.isLoaded) {
              setLoaded(true);
            }
          }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Error cargando el sonido:', error);
      }
    };

    loadSound();
  }, [localUri]);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error en la reproducción:', error);
    }
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={togglePlayback} style={styles.button} disabled={!loaded}>
        {loaded ? (
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        ) : (
          <ActivityIndicator size="small" color="#303040" />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default AudioPlayer;


