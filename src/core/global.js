import { create } from 'zustand';
import { ADDRESS } from './api';
import secure from './secure';
import api from './api';
import { log, getImage, getAudio } from './utils';

const SOURCES = {
  MINIATURA: 'miniatura',
};

function responseFriendList(set, get, friendList) {
  set(() => ({
    friendList: Array.isArray(friendList) ? friendList : [],
  }));
}

function responseFriendNew(set, get, friend) {
  const friendList = [friend, ...get().friendList];
  set(() => ({
    friendList,
  }));
}

function responseMessageList(set, get, data) {
  const { messages } = data;
  const processedMessages = messages.map((message) => {
    if (message.image) {
      const imgSource = getImage(message.image);
      if (imgSource.uri) {
        message.image = imgSource.uri;
      }
    }
    if (message.audio) {
      const audioSource = getAudio(message.audio);
      if (audioSource.uri) {
        message.audio = audioSource.uri;
      }
    }
    return message;
  });
  const messagesList = Array.isArray(get().messagesList)
    ? [...get().messagesList, ...processedMessages]
    : processedMessages;
  set(() => ({
    messagesList,
    messagesNext: data.next,
    messagesUsername: data.friend.username,
  }));
}

function updateFriendPreview(set, get, username, preview, created) {
  const friendList = [...get().friendList];
  const friendIndex = friendList.findIndex(
    (item) => item.friend.username === username
  );
  if (friendIndex >= 0) {
    const item = { ...friendList[friendIndex] };
    item.preview = preview;
    item.updated = created;  // Se usa "updated" en lugar de "update"
    item.unreadCount = (item.unreadCount || 0) + 1;
    item.isNew = true;  // Marca este chat como nuevo
    // Remueve el elemento y lo agrega al inicio para tener los chats con actividad reciente arriba
    friendList.splice(friendIndex, 1);
    friendList.unshift(item);
    set(() => ({ friendList }));
  }
}

// Función auxiliar para marcar como leído
function markFriendAsReadFn(set, get, username) {
  const updatedList = get().friendList.map(item =>
    item.friend.username === username
      ? { ...item, unreadCount: 0, isNew: false }
      : item
  );
  set({ friendList: updatedList });
}

function responseMessageSend(set, get, data) {
  const username = data.friend.username;
  if (data.message.isNew) {
    updateFriendPreview(set, get, username, data.message.text, data.message.created);
  }
  const messagesList = [data.message, ...get().messagesList];
  set(() => ({
    messagesList,
    messagesTyping: null,
  }));
}

function responseMessageSendImage(set, get, data) {
  const username = data.friend.username;
  if (data.message.isNew) {
    updateFriendPreview(set, get, username, '[Imagen]', data.message.created);
  }
  let message = data.message;
  if (message.image) {
    const imgSource = getImage(message.image);
    if (imgSource.uri) {
      message.image = imgSource.uri;
    }
  }
  const messagesList = [message, ...get().messagesList];
  set(() => ({
    messagesList,
    messagesTyping: null,
  }));
}

function responseMessageSendAudio(set, get, data) {
  const username = data.friend.username;
  if (data.message.isNew) {
    updateFriendPreview(set, get, username, '[Audio]', data.message.created);
  }
  let message = data.message;
  if (message.audio) {
    const audioSource = getAudio(message.audio);
    if (audioSource.uri) {
      message.audio = audioSource.uri;
    }
  }
  const messagesList = [message, ...get().messagesList];
  set(() => ({
    messagesList,
    messagesTyping: null,
  }));
}

function responseMessageType(set, get, data) {
  set(() => ({
    messagesTyping: new Date(),
  }));
}

function responseRequestAccept(set, get, connection) {
  const user = get().user;
  if (user.username === connection.receiver.username) {
    const requestList = [...get().requestList];
    const requestIndex = requestList.findIndex(
      (request) => request.id === connection.id
    );
    if (requestIndex >= 0) {
      requestList.splice(requestIndex, 1);
      set(() => ({ requestList }));
    }
  }
  const sl = get().searchList;
  if (!sl) return;
  const searchList = [...sl];
  let searchIndex = -1;
  if (user.username === connection.receiver.username) {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.sender.username
    );
  } else {
    searchIndex = searchList.findIndex(
      (user) => user.username === connection.receiver.username
    );
  }
  if (searchIndex >= 0) {
    searchList[searchIndex].status = 'connected';
    set(() => ({ searchList }));
  }
}

function responseRequestConnect(set, get, data) {
  const user = get().user;
  if (user.username === data.sender.username) {
    const searchList = [...get().searchList];
    const searchIndex = searchList.findIndex(
      (request) => request.username === data.receiver.username
    );
    if (searchIndex >= 0) {
      searchList[searchIndex].status = 'pending-them';
      set(() => ({ searchList }));
    }
  } else {
    const requestList = [...get().requestList];
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
    user: data,
  }));
}

const useGlobal = create((set, get) => ({
  initialized: false,
  authenticated: false,
  user: {},
  init: async () => {
    try {
      const credentials = await secure.get('credentials');
      if (!credentials || !credentials.username || !credentials.password) {
        set({ initialized: true });
        return;
      }
      const response = await api.post('/chat/signin/', credentials);
      if (response?.status === 200) {
        const { user, tokens } = response.data;
        if (user && tokens) {
          await secure.set('tokens', tokens);
          set({
            authenticated: true,
            user,
          });
        }
      }
    } catch (error) {
      console.error('Error en init:', error.message || error);
    } finally {
      set({ initialized: true });
    }
  },
  login: async (credentials, user, tokens) => {
    await secure.set('credentials', credentials);
    await secure.set('tokens', tokens);
    set({
      authenticated: true,
      user,
    });
  },
  logout: async () => {
    await secure.wipe();
    set({
      authenticated: false,
      user: {},
      initialized: true,
    });
  },
  socket: null,
  socketConnected: false,
  socketConnect: async (retries = 3) => {
    try {
      const tokens = await secure.get('tokens');
      if (!tokens?.access) return;
      const protocol = ADDRESS.startsWith('https') ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${ADDRESS}/ws/chat/?token=${tokens.access}`);
      socket.onopen = () => {
        log('socket.onopen');
        socket.send(JSON.stringify({ source: 'request.list' }));
        set({ socketConnected: true });
        socket.send(JSON.stringify({ source: 'friend.list' }));
      };
      socket.onmessage = (event) => {
        const parsed = JSON.parse(event.data);
        const responses = {
          'friend.list': responseFriendList,
          'friend.new': responseFriendNew,
          'message.list': responseMessageList,
          'message.send': responseMessageSend,
          'message.send_image': responseMessageSendImage,
          'message.send_audio': responseMessageSendAudio,
          'message.type': responseMessageType,
          'request.accept': responseRequestAccept,
          'request.connect': responseRequestConnect,
          'request.list': responseRequestList,
          'search': responseSearch,
          'miniatura': responseMiniatura,
        };
        const resp = responses[parsed.source];
        if (resp) resp(set, get, parsed.data);
      };
      socket.onerror = () => {
        set({ socket: null, socketConnected: false });
        if (retries > 0) setTimeout(() => get().socketConnect(retries - 1), 3000);
      };
      socket.onclose = () => {
        set({ socket: null, socketConnected: false });
        if (retries > 0) setTimeout(() => get().socketConnect(retries - 1), 3000);
      };
      set({ socket });
    } catch (error) {
      console.error('Error al conectar WebSocket:', error.message || error);
    }
  },
  socketClose: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, socketConnected: false });
    }
  },
  searchList: [],
  searchUsers: (query) => {
    const socket = get().socket;
    if (query && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ source: 'search', query }));
    } else {
      set(() => ({ searchList: [] }));
    }
  },
  friendList: [],
  messagesList: [],
  messagesNext: null,
  messagesTyping: null,
  messagesUsername: null,
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
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      socket.send(
        JSON.stringify({
          source: 'message.send_image',
          connectionId,
          base64: base64Data,
          filename,
        })
      );
    }
  },
  messageSendAudio: (connectionId, base64, filename) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          source: 'message.send_audio',
          connectionId,
          base64,
          filename,
        })
      );
    }
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
  requestList: [],
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
      socket.send(
        JSON.stringify({
          source: SOURCES.MINIATURA,
          base64: file.base64,
          filename: file.fileName,
        })
      );
    }
  },
  // Agregamos markFriendAsRead a la tienda para que esté disponible globalmente
  markFriendAsRead: (username) => markFriendAsReadFn(set, get, username),
}));

export default useGlobal;
