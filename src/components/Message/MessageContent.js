import React, { memo } from 'react';
import { Text } from 'react-native';
import MessageImage from './MessageImage';
import AudioPlayer from './AudioPlayer';
import styles from '../../Styles/messageStyles';

const MessageContent = memo(({ message, onImagePress }) => {
  if (message.image) {
    return <MessageImage message={message} onImagePress={onImagePress} />;
  } else if (message.audio) {
    return <AudioPlayer audioUri={message.audio} messageId={message.id} />;
  } else {
    return <Text style={styles.bubbleText}>{message.text}</Text>;
  }
});

export default MessageContent;
