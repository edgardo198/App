import React, { memo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faImage, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import styles from '../../Styles/messageStyles';
import RecordingAnimation from '../Message/RecordingAnimation';

const MessageInput = memo(({ message, setMessage, onSend, onImage, onAudio, isRecording }) => (
  <View style={styles.messageInputContainer}>
    <View style={styles.mediaButtonsContainer}>
      <TouchableOpacity onPress={onImage} style={styles.mediaButton}>
        <FontAwesomeIcon icon={faImage} size={24} color="#303040" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onAudio} style={styles.mediaButton}>
        <FontAwesomeIcon icon={faMicrophone} size={24} color="#303040" />
      </TouchableOpacity>
      {isRecording && <RecordingAnimation />}
    </View>
    <TextInput
      placeholder="Mensajes..."
      placeholderTextColor="#909090"
      value={message}
      onChangeText={setMessage}
      style={styles.textInput}
    />
    <TouchableOpacity onPress={onSend}>
      <FontAwesomeIcon icon={faPaperPlane} size={22} color="#303040" style={styles.sendButton} />
    </TouchableOpacity>
  </View>
));

export default MessageInput;
