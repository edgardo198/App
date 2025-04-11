import React, { useState, memo } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faPaperPlane, 
  faPaperclip, 
  faImage, 
  faMicrophone, 
  faVideo, 
  faFile 
} from '@fortawesome/free-solid-svg-icons';
import RecordingAnimation from '../Message/RecordingAnimation';
import styles from '../../Styles/messageStyles'; // Estilos existentes

const MessageInput = memo(({
  message,
  setMessage,
  onSend,
  onImage,
  onAudio,
  onVideo,
  onDocument,
  isRecording
}) => {
  const [showMediaMenu, setShowMediaMenu] = useState(false);

  const toggleMediaMenu = () => {
    setShowMediaMenu(prev => !prev);
  };

  return (
    <View style={inputStyles.container}>
      {/* Fila principal de input */}
      <View style={inputStyles.inputRow}>
        <TouchableOpacity onPress={toggleMediaMenu} style={inputStyles.clipButton}>
          <FontAwesomeIcon icon={faPaperclip} size={24} color="#303040" />
        </TouchableOpacity>
        <TextInput
          placeholder="Mensajes..."
          placeholderTextColor="#909090"
          value={message}
          onChangeText={setMessage}
          style={[styles.textInput, inputStyles.textInput]}
        />
        <TouchableOpacity onPress={onSend} style={inputStyles.sendButtonContainer}>
          <FontAwesomeIcon icon={faPaperPlane} size={22} color="#303040" />
        </TouchableOpacity>
      </View>

      {/* Menú desplegable de medios */}
      {showMediaMenu && (
        <View style={inputStyles.mediaMenuContainer}>
          <TouchableOpacity onPress={onImage} style={inputStyles.mediaMenuItem}>
            <FontAwesomeIcon icon={faImage} size={20} color="#303040" />
            <Text style={inputStyles.mediaMenuText}></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onVideo} style={inputStyles.mediaMenuItem}>
            <FontAwesomeIcon icon={faVideo} size={20} color="#303040" />
            <Text style={inputStyles.mediaMenuText}></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDocument} style={inputStyles.mediaMenuItem}>
            <FontAwesomeIcon icon={faFile} size={20} color="#303040" />
            <Text style={inputStyles.mediaMenuText}></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAudio} style={inputStyles.mediaMenuItem}>
            <FontAwesomeIcon icon={faMicrophone} size={20} color="#303040" />
            <Text style={inputStyles.mediaMenuText}></Text>
          </TouchableOpacity>
          {isRecording && <RecordingAnimation />}
        </View>
      )}
    </View>
  );
});

const inputStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clipButton: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sendButtonContainer: {
    padding: 6,
  },
  mediaMenuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  mediaMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  mediaMenuText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#303040',
  },
});

export default MessageInput;


