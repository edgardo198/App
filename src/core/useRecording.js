import { Alert, Platform } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

function getAudioFilename() {
  return `audio-${Date.now()}.m4a`;
}

export default function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);

  const startRecording = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'No disponible en navegador',
        'La grabacion de audio sigue disponible desde la app movil.'
      );
      return false;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Activa el permiso del microfono para grabar audio.');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      return true;
    } catch (error) {
      console.error('Error al iniciar la grabacion:', error?.message || error);
      Alert.alert('Error', 'No se pudo iniciar la grabacion.');
      return false;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (Platform.OS === 'web' || !recordingRef.current) {
      return null;
    }

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        return null;
      }

      return {
        uri,
        fileName: getAudioFilename(),
        mimeType: 'audio/mp4',
      };
    } catch (error) {
      console.error('Error al detener la grabacion:', error?.message || error);
      Alert.alert('Error', 'No se pudo finalizar la grabacion.');
      return null;
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
}
