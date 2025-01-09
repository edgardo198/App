import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { 
    Keyboard, 
    SafeAreaView, 
    Text, 
    TouchableWithoutFeedback, 
    View, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    Easing, 
    Animated 
} from 'react-native';
import Miniatura from '../common/Miniatura';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import useGlobal from '../core/global';

const styles = {
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16 },
    headerText: { color: '#202020', marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
    messageInputContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderRadius: 25,
        borderColor: '#d0d0d0',
        backgroundColor: 'white',
        height: 50,
    },
    sendButton: { marginHorizontal: 12 },
    bubbleContainerMe: {
        flexDirection: 'row',
        padding: 4,
        justifyContent: 'flex-end',
    },
    bubbleMe: {
        backgroundColor: '#e1f5fe',
        borderRadius: 18,
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'center',
        marginRight: 8,
        minHeight: 42,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    bubbleText: {
        color: '#303030',
        fontSize: 16,
        lineHeight: 18,
        fontWeight: '500',
    },
};

function MessageHeader({ friend }) {
    return (
        <View style={styles.header}>
            <Miniatura url={friend?.miniatura} size={35} />
            <Text style={styles.headerText}>{friend?.name}</Text>
        </View>
    );
}

function MessageBubbleMe({ text }) {
    return (
        <View style={styles.bubbleContainerMe}>
            <View style={styles.bubbleMe}>
                <Text style={styles.bubbleText}>{text}</Text>
            </View>
        </View>
    );
}

function MessageTypingAnimation({ offset }) {
    const y = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bump = 200;
        const animation = Animated.loop(
            Animated.sequence([ 
                Animated.delay(bump * offset),
                Animated.timing(y, {
                    toValue: 1,
                    duration: bump,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(y, {
                    toValue: 0,
                    duration: bump,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.delay(1000 - bump * 2 - bump * offset),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [offset]);

    const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

    return (
        <Animated.View
            style={{
                width: 8,
                height: 8,
                marginHorizontal: 1.5,
                borderRadius: 4,
                backgroundColor: '#606060',
                transform: [{ translateY }],
            }}
        />
    );
}

function MessageBubbleFriend({ text = '', friend, typing = false }) {
    return (
        <View style={{ flexDirection: 'row', padding: 4, justifyContent: 'flex-start' }}>
            <Miniatura url={friend?.miniatura} size={42} />
            <View style={styles.bubbleMe}>
                {typing ? (
                    <View style={{ flexDirection: 'row' }}>
                        <MessageTypingAnimation offset={0} />
                        <MessageTypingAnimation offset={1} />
                        <MessageTypingAnimation offset={2} />
                    </View>
                ) : (
                    <Text style={styles.bubbleText}>{text}</Text>
                )}
            </View>
        </View>
    );
}

function MessageBubble({ index, message, friend }) {
    const [showTyping, setShowTyping] = useState(false);

    const messagesTyping = useGlobal((state) => state.messagesTyping);

    useEffect(() => {
        if (index !== 0) return;
        if (messagesTyping === null) {
            setShowTyping(false);
            return;
        }
        setShowTyping(true);
        const check = setInterval(() => {
            const now = new Date();
            const ms = now - messagesTyping;
            if (ms > 10000) {
                setShowTyping(false);
            }
        }, 1000);
        return () => clearInterval(check);
    }, [index, messagesTyping]);

    if (index === 0) {
        if (showTyping) return <MessageBubbleFriend friend={friend} typing={true} />;
        return null;
    }

    return message.is_me ? (
        <MessageBubbleMe text={message.text} />
    ) : (
        <MessageBubbleFriend text={message.text} friend={friend} />
    );
}

function MessageInput({ message, setMessage, onSend }) {
    return (
        <View style={styles.messageInputContainer}>
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
    );
}

function MessagesScreen({ navigation, route }) {
    const [message, setMessage] = useState('');
    const messagesList = useGlobal((state) => state.messagesList);

    const messageList = useGlobal((state) => state.messageList);
    const messageSend = useGlobal((state) => state.messageSend);
    const messageType = useGlobal((state) => state.messageType);

    const conectionId = route?.params?.id;
    const friend = route.params.friend;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => <MessageHeader friend={friend} />,
        });
    }, [friend, navigation]);

    useEffect(() => {
        if (conectionId) {
            messageList(conectionId);
        }
    }, [conectionId, messageList]);

    const onSend = useCallback(() => {
        const cleaned = message.trim();
        if (!cleaned) return;
        messageSend(conectionId, cleaned);
        setMessage('');
    }, [conectionId, message, messageSend]);

    const onType = useCallback(
        (value) => {
            setMessage(value);
            messageType(friend.username);
        },
        [friend.username, messageType]
    );

    return (
        <SafeAreaView style={styles.container}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <FlatList
                        automaticallyAdjustKeyboardInsets
                        contentContainerStyle={{ paddingTop: 30 }}
                        data={messagesList && Array.isArray(messagesList) ? [{ id: -1 }, ...messagesList] : []}
                        inverted
                        keyExtractor={(item) => item?.id?.toString() || item?.id}
                        renderItem={({ item, index }) => {
                            if (!item || typeof item !== 'object') {
                                console.warn(`Invalid item at index ${index}:`, item);
                                return null;
                            }
                            return <MessageBubble index={index} message={item} friend={friend} />;
                        }}
                    />
                </View>
            </TouchableWithoutFeedback>
            <MessageInput message={message} setMessage={onType} onSend={onSend} />
        </SafeAreaView>
    );
}

export default MessagesScreen;



