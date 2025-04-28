import { create } from 'zustand';
import { ADDRESS } from './api';
import secure from './secure';
import api from './api';
import { log, getImage, getAudio, getVideo, getDocument } from './utils';
import { FlatList } from 'react-native';
import axios from 'axios';

// Definición de funciones auxiliares y de respuesta
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
      message.image = imgSource.uri;
    }
    if (message.audio) {
      const audioSource = getAudio(message.audio);
      message.audio = audioSource.uri;
    }
    // Añadir procesamiento para video y documento
    if (message.video) {
      const videoSource = getVideo(message.video);
      message.video = videoSource.uri;
    }
    if (message.document) {
      const documentSource = getDocument(message.document);
      message.document = documentSource.uri;
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

// Definición de updateFriendPreview como función de la tienda
const updateFriendPreview = (set, get, username, preview, created, is_me, type = 'text', content = null) => {
  if (!username) {
    console.warn("WARNING: Username es inválido o undefined");
    return;
  }
  
  const friendList = get().friendList;
  if (!Array.isArray(friendList)) return;
  
  // Normalizamos el username para evitar problemas de mayúsculas/minúsculas.
  const normalizedUsername = username.trim().toLowerCase();
  
  // Buscamos el ítem existente en la friendList con comparación exacta.
  let friendIndex = friendList.findIndex(
    (item) =>
      item.friend &&
      item.friend.username &&
      item.friend.username.trim().toLowerCase() === normalizedUsername
  );
  
  // Si no se encuentra, intentamos una búsqueda parcial.
  if (friendIndex === -1) {
    console.warn(`[updateFriendPreview] WARNING: No se encontró el amigo ${username} con comparación exacta. Intentando búsqueda parcial.`);
    friendIndex = friendList.findIndex(
      (item) =>
        item.friend &&
        item.friend.username &&
        item.friend.username.toLowerCase().includes(normalizedUsername)
    );
  }
  
  // Definimos el preview según el tipo.
  let fixedPreview;
  if (type === "text") {
    fixedPreview = preview;
  } else if (type === "image") {
    fixedPreview = "[Imagen]";
  } else if (type === "audio") {
    fixedPreview = "[Audio]";
  } else if (type === "video") {
    fixedPreview = "[Video]";
  } else if (type === "document") {
    fixedPreview = "[Documento]";
  } else {
    fixedPreview = "[Mensaje]";
  }
  
  const item = friendList[friendIndex];
  
  let updatedItem;
  if (is_me) {
    updatedItem = {
      ...item,
      updated: created,
      preview: fixedPreview,
      message: { type, content, text: fixedPreview, is_me }
    };
  } else {
    // Para mensajes recibidos (is_me false): se incrementa el contador y se actualiza el preview.
    const newCount = (item.unreadCount || 0) + 1;
    updatedItem = {
      ...item,
      updated: created,
      isNew: true,
      preview: fixedPreview,
      unreadCount: newCount,
      message: { type, content, text: fixedPreview, is_me }
    };
  }
  
  const newFriendList = [...friendList];
  newFriendList[friendIndex] = updatedItem;
  set({ friendList: newFriendList });
};

// Mueve la definición de markFriendAsReadFn ANTES de la creación del store
function markFriendAsReadFn(set, get, username) {
  const updatedList = get().friendList.map(item =>
    item.friend.username === username
      ? { ...item, unreadCount: 0, isNew: false }
      : item
  );
  set({ friendList: updatedList });
}

function responseMessageSendCommon(set, get, data, typeOverride = null) {
  const currentUser = get().user;
  if (!data?.message) {
    console.warn("WARNING: data.message no está definido.");
    return;
  }

  let sender, receiver;

  // Intentamos usar sender y receiver si vienen en el payload.
  if (data.sender && data.receiver) {
    sender = typeof data.sender === "string" ? { username: data.sender } : data.sender;
    receiver = typeof data.receiver === "string" ? { username: data.receiver } : data.receiver;
  } else if (data.friend) {
    console.warn("WARNING: Sender o receiver no están definidos en el payload. Usando data.friend como fallback.");
    const fallbackFriendUsername =
      typeof data.friend === "string"
        ? data.friend.trim()
        : (data.friend?.username || "").trim();
    if (!fallbackFriendUsername) {
      console.warn("WARNING: data.friend está vacío.");
      return;
    }
    if (fallbackFriendUsername.toLowerCase() === currentUser.username.trim().toLowerCase()) {
      console.warn("WARNING: data.friend es igual al usuario actual. No se puede determinar la contraparte.");
      return;
    }
    if (typeof data.message.is_me === "boolean") {
      if (data.message.is_me === true) {
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
    console.warn("WARNING: Sender o receiver no están definidos en el payload");
    return;
  }

  const currentName = currentUser.username.trim().toLowerCase();
  const senderName = sender.username.trim().toLowerCase();
  const receiverName = receiver.username.trim().toLowerCase();

  let friendUsername = "";
  if (currentName === senderName && currentName !== receiverName) {
    friendUsername = receiver.username;
  } else if (currentName === receiverName && currentName !== senderName) {
    friendUsername = sender.username;
  } else {
    friendUsername = data.friend
      ? (typeof data.friend === "string" ? data.friend : data.friend.username)
      : "";
    if (!friendUsername || friendUsername.trim().toLowerCase() === currentName) {
      console.warn("WARNING: No se pudo determinar correctamente la contraparte (friend).");
      return;
    }
  }

  if (!friendUsername) {
    console.warn("WARNING: No se pudo extraer el username del friend correctamente");
    return;
  }

  const isMe = currentName === senderName;

  // Usamos typeOverride si se proporciona; sino, usamos data.message.type.
  const finalType = typeOverride || data.message.type;
  let processedMessage = { ...data.message, type: finalType };

  // Procesamos multimedia: para imagen, audio, video y documento.
  if (finalType === "image" && processedMessage.image) {
    const imgSource = getImage(processedMessage.image);
    if (imgSource?.uri) {
      processedMessage.image = imgSource.uri;
    }
  } else if (finalType === "audio" && processedMessage.audio) {
    const audioSource = getAudio(processedMessage.audio);
    if (audioSource?.uri) {
      processedMessage.audio = audioSource.uri;
    }
  } else if (finalType === "video" && processedMessage.video) {
    // Suponemos que dispones de una función getVideo similar a getImage/getAudio.
    const videoSource = typeof getVideo === "function" ? getVideo(processedMessage.video) : null;
    if (videoSource?.uri) {
      processedMessage.video = videoSource.uri;
    }
  } else if (finalType === "document" && processedMessage.document) {
    // Para documentos, podrías simplemente dejar la URL o procesarla si es necesario.
    const documentSource = typeof getDocument === "function" ? getDocument(processedMessage.document) : null;
    if (documentSource?.uri) {
      processedMessage.document = documentSource.uri;
    }
  }

  const previewText =
    finalType === "text" ? (processedMessage.text || "") :
    finalType === "image" ? "[Imagen]" :
    finalType === "audio" ? "[Audio]" :
    finalType === "video" ? "[Video]" :
    finalType === "document" ? "[Documento]" :
    "[Mensaje]";

  const contentValue =
    finalType === "text" ? processedMessage.text :
    finalType === "image" ? processedMessage.image :
    finalType === "audio" ? processedMessage.audio :
    finalType === "video" ? processedMessage.video :
    finalType === "document" ? processedMessage.document : null;

  updateFriendPreview(set, get, friendUsername, previewText, processedMessage.created, isMe, finalType, contentValue);

  set({ messagesList: [processedMessage, ...get().messagesList], messagesTyping: null });
}


// Función para mensajes de texto.
// Función para mensajes de texto.
function responseMessageSend(set, get, data) {
  responseMessageSendCommon(set, get, data);
}

// Función para mensajes con imagen.
function responseMessageSendImage(set, get, data) {
  responseMessageSendCommon(set, get, data, "image");
}

// Función para mensajes con audio.
function responseMessageSendAudio(set, get, data) {
  responseMessageSendCommon(set, get, data, "audio");
}

// Función para mensajes con video.
function responseMessageSendVideo(set, get, data) {
  responseMessageSendCommon(set, get, data, "video");
}

// Función para mensajes con documentos.
function responseMessageSendDocument(set, get, data) {
  responseMessageSendCommon(set, get, data, "document");
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

// Creación del store con Zustand
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
      friendList: [],
      searchList: [],
      requestList: [],
      messagesList: [],
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
          'message.send_video': responseMessageSendVideo,       
          'message.send_document': responseMessageSendDocument,
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
  // Cambiar a HTTP para archivos grandes
  messageSendVideo: (connectionId, base64, filename) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      // Extraemos solo la parte base64 sin el encabezado
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      socket.send(
        JSON.stringify({
          source: 'message.send_video',
          connectionId,
          base64: base64Data,
          filename,
        })
      );
    }
  },
  messageSendDocument: (connectionId, base64, filename) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      socket.send(
        JSON.stringify({
          source: 'message.send_document',
          connectionId,
          base64: base64Data,
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