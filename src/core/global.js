import { Alert, Platform } from 'react-native';
import { create } from 'zustand';
import api, { getWsBaseUrl } from './api';
import secure from './secure';
import { getAudio, getDocument, getImage, getVideo } from './utils';

const SESSION_RESET_STATE = {
  authenticated: false,
  user: {},
  friendList: [],
  searchList: [],
  requestList: [],
  messagesList: [],
  messagesNext: null,
  messagesTyping: null,
  messagesUsername: null,
  socket: null,
  socketConnected: false,
  socketShouldReconnect: false,
};

function responseFriendList(set, get, friendList) {
  set(() => ({
    friendList: Array.isArray(friendList) ? friendList : [],
  }));
}

function responseFriendNew(set, get, friend) {
  const currentFriendList = Array.isArray(get().friendList) ? get().friendList : [];
  set(() => ({
    friendList: [friend, ...currentFriendList],
  }));
}

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeBase64Payload(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  return trimmedValue.includes(',') ? trimmedValue.split(',', 2)[1].trim() : trimmedValue;
}

function sendBase64OverSocket(socket, source, connectionId, base64, filename) {
  if (socket?.readyState !== WebSocket.OPEN) {
    return false;
  }

  const base64Data = normalizeBase64Payload(base64);
  const safeFilename = typeof filename === 'string' ? filename.trim() : '';
  if (!base64Data || !safeFilename) {
    console.warn(`WARNING: Payload Base64 invalido para ${source}.`);
    return false;
  }

  socket.send(
    JSON.stringify({
      source,
      connectionId,
      base64: base64Data,
      filename: safeFilename,
    })
  );
  return true;
}

function responseMessageList(set, get, data) {
  const processedMessages = (Array.isArray(data?.messages) ? data.messages : []).map((message) => {
    const processedMessage = { ...message };

    if (processedMessage.image) {
      processedMessage.image = getImage(processedMessage.image)?.uri || processedMessage.image;
    }

    if (processedMessage.audio) {
      processedMessage.audio = getAudio(processedMessage.audio)?.uri || processedMessage.audio;
    }

    if (processedMessage.video) {
      processedMessage.video = getVideo(processedMessage.video)?.uri || processedMessage.video;
    }

    if (processedMessage.document) {
      processedMessage.document =
        getDocument(processedMessage.document)?.uri || processedMessage.document;
    }

    return processedMessage;
  });

  const currentMessages = Array.isArray(get().messagesList) ? get().messagesList : [];

  set(() => ({
    messagesList: [...currentMessages, ...processedMessages],
    messagesNext: data?.next ?? null,
    messagesUsername: data?.friend?.username ?? null,
  }));
}

const updateFriendPreview = (
  set,
  get,
  username,
  preview,
  created,
  isMe,
  type = 'text',
  content = null
) => {
  if (!username) {
    console.warn('WARNING: Username invalido o vacio en updateFriendPreview.');
    return;
  }

  const friendList = get().friendList;
  if (!Array.isArray(friendList)) {
    return;
  }

  const normalizedUsername = username.trim().toLowerCase();

  let friendIndex = friendList.findIndex(
    (item) =>
      item?.friend?.username &&
      item.friend.username.trim().toLowerCase() === normalizedUsername
  );

  if (friendIndex === -1) {
    friendIndex = friendList.findIndex(
      (item) =>
        item?.friend?.username &&
        item.friend.username.toLowerCase().includes(normalizedUsername)
    );
  }

  if (friendIndex === -1) {
    console.warn(`[updateFriendPreview] WARNING: No se encontro al amigo ${username}.`);
    return;
  }

  const item = friendList[friendIndex];
  if (!item) {
    return;
  }

  const fixedPreview =
    type === 'text'
      ? preview
      : type === 'image'
        ? '[Imagen]'
        : type === 'audio'
          ? '[Audio]'
          : type === 'video'
            ? '[Video]'
            : type === 'document'
              ? '[Documento]'
              : '[Mensaje]';

  const nextItem = isMe
    ? {
        ...item,
        updated: created,
        preview: fixedPreview,
        message: { type, content, text: fixedPreview, is_me: isMe },
      }
    : {
        ...item,
        updated: created,
        isNew: true,
        preview: fixedPreview,
        unreadCount: (item.unreadCount || 0) + 1,
        message: { type, content, text: fixedPreview, is_me: isMe },
      };

  const nextFriendList = [...friendList];
  nextFriendList.splice(friendIndex, 1);
  nextFriendList.unshift(nextItem);
  set({ friendList: nextFriendList });
};

function markFriendAsReadFn(set, get, username) {
  const friendList = Array.isArray(get().friendList) ? get().friendList : [];
  const updatedList = friendList.map((item) =>
    item?.friend?.username === username
      ? { ...item, unreadCount: 0, isNew: false }
      : item
  );
  set({ friendList: updatedList });
}

function responseMessageSendCommon(set, get, data, typeOverride = null) {
  const currentUser = get().user;
  if (!currentUser?.username || !data?.message) {
    console.warn('WARNING: Payload de mensaje incompleto.');
    return;
  }

  let sender;
  let receiver;

  if (data.sender && data.receiver) {
    sender = typeof data.sender === 'string' ? { username: data.sender } : data.sender;
    receiver = typeof data.receiver === 'string' ? { username: data.receiver } : data.receiver;
  } else if (data.friend) {
    const fallbackFriendUsername =
      typeof data.friend === 'string'
        ? data.friend.trim()
        : (data.friend?.username || '').trim();

    if (!fallbackFriendUsername) {
      console.warn('WARNING: data.friend esta vacio.');
      return;
    }

    if (typeof data.message.is_me === 'boolean') {
      if (data.message.is_me) {
        sender = currentUser;
        receiver = { username: fallbackFriendUsername };
      } else {
        sender = { username: fallbackFriendUsername };
        receiver = currentUser;
      }
    } else {
      sender = currentUser;
      receiver = { username: fallbackFriendUsername };
    }
  } else {
    console.warn('WARNING: No fue posible determinar sender y receiver.');
    return;
  }

  const currentName = currentUser.username.trim().toLowerCase();
  const senderName = sender?.username?.trim().toLowerCase();
  const receiverName = receiver?.username?.trim().toLowerCase();

  if (!senderName || !receiverName) {
    console.warn('WARNING: El payload no contiene usernames validos.');
    return;
  }

  let friendUsername = '';
  if (currentName === senderName && currentName !== receiverName) {
    friendUsername = receiver.username;
  } else if (currentName === receiverName && currentName !== senderName) {
    friendUsername = sender.username;
  } else {
    friendUsername = data.friend
      ? typeof data.friend === 'string'
        ? data.friend
        : data.friend.username
      : '';
  }

  if (!friendUsername || friendUsername.trim().toLowerCase() === currentName) {
    console.warn('WARNING: No se pudo determinar la contraparte del mensaje.');
    return;
  }

  const isMe = currentName === senderName;
  const finalType = typeOverride || data.message.type;
  const processedMessage = { ...data.message, type: finalType };
  const currentConversationUsername = normalizeUsername(get().messagesUsername);
  const isCurrentConversation =
    currentConversationUsername &&
    currentConversationUsername === normalizeUsername(friendUsername);

  if (finalType === 'image' && processedMessage.image) {
    processedMessage.image = getImage(processedMessage.image)?.uri || processedMessage.image;
  } else if (finalType === 'audio' && processedMessage.audio) {
    processedMessage.audio = getAudio(processedMessage.audio)?.uri || processedMessage.audio;
  } else if (finalType === 'video' && processedMessage.video) {
    processedMessage.video = getVideo(processedMessage.video)?.uri || processedMessage.video;
  } else if (finalType === 'document' && processedMessage.document) {
    processedMessage.document =
      getDocument(processedMessage.document)?.uri || processedMessage.document;
  }

  const previewText =
    finalType === 'text'
      ? processedMessage.text || ''
      : finalType === 'image'
        ? '[Imagen]'
        : finalType === 'audio'
          ? '[Audio]'
          : finalType === 'video'
            ? '[Video]'
            : finalType === 'document'
              ? '[Documento]'
              : '[Mensaje]';

  const contentValue =
    finalType === 'text'
      ? processedMessage.text
      : finalType === 'image'
        ? processedMessage.image
        : finalType === 'audio'
          ? processedMessage.audio
          : finalType === 'video'
            ? processedMessage.video
            : finalType === 'document'
              ? processedMessage.document
              : null;

  updateFriendPreview(
    set,
    get,
    friendUsername,
    previewText,
    processedMessage.created,
    isMe,
    finalType,
    contentValue
  );

  if (!isCurrentConversation) {
    return;
  }

  const currentMessages = Array.isArray(get().messagesList) ? get().messagesList : [];
  const nextMessages = currentMessages.some((item) => item?.id === processedMessage.id)
    ? currentMessages.map((item) => (item?.id === processedMessage.id ? processedMessage : item))
    : [processedMessage, ...currentMessages];

  set({
    messagesList: nextMessages,
    messagesTyping: null,
  });
}

function responseMessageSend(set, get, data) {
  responseMessageSendCommon(set, get, data);
}

function responseMessageSendImage(set, get, data) {
  responseMessageSendCommon(set, get, data, 'image');
}

function responseMessageSendAudio(set, get, data) {
  responseMessageSendCommon(set, get, data, 'audio');
}

function responseMessageSendVideo(set, get, data) {
  responseMessageSendCommon(set, get, data, 'video');
}

function responseMessageSendDocument(set, get, data) {
  responseMessageSendCommon(set, get, data, 'document');
}

function responseMessageType(set, get, data) {
  const currentConversationUsername = normalizeUsername(get().messagesUsername);
  const typingUsername = normalizeUsername(data?.username);

  if (!currentConversationUsername || typingUsername !== currentConversationUsername) {
    return;
  }

  set(() => ({
    messagesTyping: new Date(),
  }));
}

function responseRequestAccept(set, get, connection) {
  const user = get().user;
  if (!user?.username || !connection) {
    return;
  }

  if (user.username === connection.receiver?.username) {
    const requestList = Array.isArray(get().requestList) ? [...get().requestList] : [];
    const requestIndex = requestList.findIndex((request) => request.id === connection.id);
    if (requestIndex >= 0) {
      requestList.splice(requestIndex, 1);
      set(() => ({ requestList }));
    }
  }

  const searchList = Array.isArray(get().searchList) ? [...get().searchList] : [];
  let searchIndex = -1;

  if (user.username === connection.receiver?.username) {
    searchIndex = searchList.findIndex(
      (searchUser) => searchUser.username === connection.sender?.username
    );
  } else {
    searchIndex = searchList.findIndex(
      (searchUser) => searchUser.username === connection.receiver?.username
    );
  }

  if (searchIndex >= 0) {
    searchList[searchIndex].status = 'connected';
    set(() => ({ searchList }));
  }
}

function responseRequestConnect(set, get, data) {
  const user = get().user;
  if (!user?.username || !data?.sender?.username || !data?.receiver?.username) {
    return;
  }

  if (user.username === data.sender.username) {
    const searchList = Array.isArray(get().searchList) ? [...get().searchList] : [];
    const searchIndex = searchList.findIndex(
      (request) => request.username === data.receiver.username
    );
    if (searchIndex >= 0) {
      searchList[searchIndex].status = 'pending-them';
      set(() => ({ searchList }));
    }
  } else {
    const requestList = Array.isArray(get().requestList) ? [...get().requestList] : [];
    const requestIndex = requestList.findIndex(
      (request) => request.username === data.sender.username
    );
    if (requestIndex === -1) {
      requestList.push(data);
      set(() => ({ requestList }));
    }
  }
}

function responseRequestList(set, get, requestList) {
  set(() => ({
    requestList: Array.isArray(requestList) ? requestList : [],
  }));
}

function responseSearch(set, get, data) {
  set(() => ({
    searchList: Array.isArray(data) ? data : [],
  }));
}

function responseMiniatura(set, get, data) {
  set(() => ({
    user: data || {},
  }));
}

function responseError(set, get, data) {
  const message =
    typeof data === 'string'
      ? data
      : data?.message || 'Se produjo un error al comunicarse con el servidor.';

  console.error('Error del socket:', message);

  if (Platform.OS !== 'web') {
    Alert.alert('Error', message);
  }
}

const useGlobal = create((set, get) => ({
  initialized: false,
  authenticated: false,
  user: {},
  socket: null,
  socketConnected: false,
  socketShouldReconnect: false,
  searchList: [],
  friendList: [],
  requestList: [],
  messagesList: [],
  messagesNext: null,
  messagesTyping: null,
  messagesUsername: null,

  init: async () => {
    try {
      const credentials = await secure.get('credentials');
      if (!credentials?.username || !credentials?.password) {
        await secure.remove('tokens');
        set({ initialized: true });
        return;
      }

      const normalizedCredentials = {
        username: credentials.username.trim(),
        password: credentials.password,
      };

      const response = await api.post('/chat/signin/', normalizedCredentials);
      const { user, tokens } = response?.data || {};

      if (!user || !tokens) {
        throw new Error('Missing session payload');
      }

      await secure.set('credentials', normalizedCredentials);
      await secure.set('tokens', tokens);

      set({
        ...SESSION_RESET_STATE,
        initialized: true,
        authenticated: true,
        user,
      });
    } catch (error) {
      console.error('Error en init:', error.message || error);
      await secure.wipe();
      set({
        ...SESSION_RESET_STATE,
        initialized: true,
      });
    }
  },

  login: async (credentials, user, tokens) => {
    const normalizedCredentials = {
      username: credentials.username.trim(),
      password: credentials.password,
    };

    await secure.set('credentials', normalizedCredentials);
    await secure.set('tokens', tokens);

    set({
      ...SESSION_RESET_STATE,
      initialized: true,
      authenticated: true,
      user,
    });
  },

  logout: async () => {
    get().socketClose(false);
    await secure.wipe();
    set({
      ...SESSION_RESET_STATE,
      initialized: true,
    });
  },

  socketConnect: async (retries = 3) => {
    try {
      const existingSocket = get().socket;
      if (
        existingSocket &&
        (existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const tokens = await secure.get('tokens');
      if (!tokens?.access) {
        set({
          socket: null,
          socketConnected: false,
          socketShouldReconnect: false,
        });
        return;
      }

      set({ socketShouldReconnect: true });

      const wsBaseUrl = await getWsBaseUrl();
      const socket = new WebSocket(`${wsBaseUrl}/ws/chat/?token=${tokens.access}`);
      let reconnectScheduled = false;

      const scheduleReconnect = () => {
        if (
          reconnectScheduled ||
          retries <= 0 ||
          !get().socketShouldReconnect ||
          !get().authenticated
        ) {
          return;
        }

        reconnectScheduled = true;
        setTimeout(() => get().socketConnect(retries - 1), 3000);
      };

      socket.onopen = () => {
        set({ socket, socketConnected: true });
        socket.send(JSON.stringify({ source: 'request.list' }));
        socket.send(JSON.stringify({ source: 'friend.list' }));
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const responses = {
            'friend.list': responseFriendList,
            'friend.new': responseFriendNew,
            'message.list': responseMessageList,
            'message.send': responseMessageSend,
            'message.send_image': responseMessageSendImage,
            'message.send_audio': responseMessageSendAudio,
            'message.send_video': responseMessageSendVideo,
            'message.send_document': responseMessageSendDocument,
            'message.type': responseMessageType,
            'request.accept': responseRequestAccept,
            'request.connect': responseRequestConnect,
            'request.list': responseRequestList,
            search: responseSearch,
            miniatura: responseMiniatura,
            error: responseError,
          };

          const handler = responses[parsed.source];
          if (handler) {
            handler(set, get, parsed.data);
          }
        } catch (error) {
          console.error('Error al procesar mensaje del socket:', error.message || error);
        }
      };

      socket.onerror = () => {
        set({ socket: null, socketConnected: false });
        scheduleReconnect();
      };

      socket.onclose = () => {
        set({ socket: null, socketConnected: false });
        scheduleReconnect();
      };

      set({ socket, socketConnected: false });
    } catch (error) {
      console.error('Error al conectar WebSocket:', error.message || error);
    }
  },

  socketClose: (shouldReconnect = false) => {
    const { socket } = get();
    set({ socketShouldReconnect: shouldReconnect });
    if (socket) {
      socket.close();
    }
    set({ socket: null, socketConnected: false });
  },

  searchUsers: (query) => {
    const socket = get().socket;
    if (query && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ source: 'search', query }));
    } else {
      set(() => ({ searchList: [] }));
    }
  },

  clearMessages: () => {
    set(() => ({
      messagesList: [],
      messagesNext: null,
      messagesTyping: null,
      messagesUsername: null,
    }));
  },

  openMessagesThread: (username) => {
    set(() => ({
      messagesUsername: typeof username === 'string' ? username.trim() : null,
      messagesTyping: null,
    }));
  },

  ingestMessagePayload: (payload) => {
    responseMessageSendCommon(set, get, payload);
  },

  messageList: (connectionId, page = 0) => {
    if (page === 0) {
      set(() => ({
        messagesList: [],
        messagesNext: null,
        messagesTyping: null,
        messagesUsername: null,
      }));
    }

    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          source: 'message.list',
          connectionId,
          page,
        })
      );
    }
  },

  messageSend: (connectionId, message) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          source: 'message.send',
          connectionId,
          message,
        })
      );
    }
  },

  messageSendImage: (connectionId, base64, filename) => {
    sendBase64OverSocket(get().socket, 'message.send_image', connectionId, base64, filename);
  },

  messageSendAudio: (connectionId, base64, filename) => {
    sendBase64OverSocket(get().socket, 'message.send_audio', connectionId, base64, filename);
  },

  messageSendVideo: (connectionId, base64, filename) => {
    sendBase64OverSocket(get().socket, 'message.send_video', connectionId, base64, filename);
  },

  messageSendDocument: (connectionId, base64, filename) => {
    sendBase64OverSocket(get().socket, 'message.send_document', connectionId, base64, filename);
  },

  messageType: (username) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          source: 'message.type',
          username,
        })
      );
    }
  },

  requestAccept: (username) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ source: 'request.accept', username }));
    }
  },

  requestConnect: (username) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ source: 'request.connect', username }));
    }
  },

  uploadMiniatura: (file) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      const base64Data = normalizeBase64Payload(file?.base64);
      const filename = typeof file?.fileName === 'string' ? file.fileName.trim() : '';
      if (!base64Data || !filename) {
        console.warn('WARNING: Payload Base64 invalido para miniatura.');
        return;
      }

      socket.send(
        JSON.stringify({
          source: 'miniatura',
          base64: base64Data,
          filename,
        })
      );
    }
  },

  markFriendAsRead: (username) => markFriendAsReadFn(set, get, username),
}));

export default useGlobal;
