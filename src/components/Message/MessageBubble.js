import React, { useEffect, useState, memo } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import MessageBubbleMe from './MessageBubbleMe';
import MessageBubbleFriend from './MessageBubbleFriend';
import useGlobal from '../../core/global';

const MessageBubble = memo(({ index, message, friend, onImagePress }) => {
  const [showTyping, setShowTyping] = useState(false);
  const messagesTyping = useGlobal((state) => state.messagesTyping);

  useEffect(() => {
    if (index !== 0) return;
    if (!messagesTyping) {
      setShowTyping(false);
      return;
    }
    setShowTyping(true);
    const timeout = setTimeout(() => {
      setShowTyping(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [index, messagesTyping]);

  if (index === 0 && showTyping)
    return <MessageBubbleFriend message={{}} friend={friend} typing={true} onImagePress={onImagePress} />;
  if (index === 0) return null;
  return message.is_me ? (
    <MessageBubbleMe message={message} onImagePress={onImagePress} />
  ) : (
    <MessageBubbleFriend message={message} friend={friend} onImagePress={onImagePress} />
  );
});

export default MessageBubble;
