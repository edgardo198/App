import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { resolveMediaUrl } from '../../core/api';
import styles from '../../Styles/audioStyles';

function getValidUrl(url) {
  return url ? resolveMediaUrl(url) : null;
}

function getSafeFilename(messageId, filename) {
  return (filename || `audio_${messageId || 'chat'}.m4a`).replace(/[^\w.\-]/g, '_');
}

const AudioPlayer = memo(({ audioUri = '', messageId = '', filename = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [localUri, setLocalUri] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const downloadAudio = async () => {
      try {
        const validAudioUri = getValidUrl(audioUri);
        if (!validAudioUri) {
          console.error('URL de audio invalida');
          return;
        }

        if (Platform.OS === 'web') {
          setLocalUri(validAudioUri);
          return;
        }

        const fileUri = `${FileSystem.cacheDirectory}${getSafeFilename(messageId, filename)}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
          const { uri } = await FileSystem.downloadAsync(validAudioUri, fileUri);
          if (isMounted) {
            setLocalUri(uri);
          }
        } else if (isMounted) {
          setLocalUri(fileUri);
        }
      } catch (error) {
        console.error('Error descargando el audio:', error?.message || error);
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
  }, [audioUri, filename, messageId]);

  useEffect(() => {
    if (!localUri) {
      return;
    }

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: localUri },
          { shouldPlay: false },
          (playbackStatus) => {
            if (playbackStatus.isLoaded) {
              setLoaded(true);
              if (playbackStatus.didJustFinish) {
                setIsPlaying(false);
              }
            }
          }
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Error cargando el sonido:', error?.message || error);
      }
    };

    loadSound();
  }, [localUri]);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error en la reproduccion:', error?.message || error);
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
