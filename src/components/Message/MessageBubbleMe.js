import React, { memo, useState } from 'react';
import { View } from 'react-native';
import MessageContent from './MessageContent';
import styles from '../../Styles/messageStyles';

const MessageBubbleMe = memo(({ message, onImagePress }) => (
  <View style={styles.bubbleContainerMe}>
    <View style={styles.bubbleMe}>
      <MessageContent message={message} onImagePress={onImagePress} />
    </View>
  </View>
));

export default MessageBubbleMe;
