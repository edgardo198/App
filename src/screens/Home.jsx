import React, { useEffect, useLayoutEffect, useRef, useCallback, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faInbox, faUser, faUserFriends, faSearch } from '@fortawesome/free-solid-svg-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';
import RequestScreen from './Requests';
import FriendsScreen from './Friends';
import ProfileScreen from './Profile';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import debounce from 'lodash/debounce';

const Tab = createBottomTabNavigator();

const icons = {
  Solicitudes: faInbox,
  Amigos: faUserFriends,
  Perfil: faUser,
};

const HomeScreen = ({ navigation }) => {
  const socketConnect = useGlobal((state) => state.socketConnect);
  const socketClose = useGlobal((state) => state.socketClose);
  const user = useGlobal((state) => state.user);
  const friendList = useGlobal((state) => state.friendList) || [];
  const requestList = useGlobal((state) => state.requestList) || [];
  const isFocused = useIsFocused();

  // Cálculo de mensajes nuevos (solo para mensajes recibidos)
  const totalUnread = useMemo(() => {
    return friendList.reduce((acc, friendItem) => {
      if (friendItem.message && !friendItem.message.is_me) {
        return acc + (friendItem.unreadCount || 0);
      }
      return acc;
    }, 0);
  }, [friendList]);

  // Estado para el contador mostrado, actualizado con debounce
  const [displayCount, setDisplayCount] = useState(totalUnread);
  const debouncedSetCount = useCallback(
    debounce((newCount) => {
      setDisplayCount(newCount);
    }, 500),
    []
  );
  useEffect(() => {
    debouncedSetCount(totalUnread);
  }, [totalUnread, debouncedSetCount]);

  const newRequestsCount = requestList.length;
  const prevTotalUnreadRef = useRef(totalUnread);

  // Cargar y cachear el sonido para notificación
  const [notificationSound, setNotificationSound] = useState(null);
  useEffect(() => {
    let sound;
    const loadSound = async () => {
      try {
        const { sound: loadedSound } = await Audio.Sound.createAsync(
          require('../assets/sonidos/messenger-tono-mensaje-.mp3')
        );
        sound = loadedSound;
        setNotificationSound(loadedSound);
      } catch (error) {
        console.log('Error al cargar el sonido:', error);
      }
    };
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    if (notificationSound) {
      try {
        await notificationSound.replayAsync();
      } catch (error) {
        console.log('Error al reproducir sonido de notificación:', error);
      }
    }
  }, [notificationSound]);

  // Debounce para evitar múltiples reproducciones en ráfaga
  const debouncedPlaySound = useCallback(
    debounce(() => {
      playNotificationSound();
    }, 500),
    [playNotificationSound]
  );

  // Reproduce el sonido si aumenta totalUnread y la pantalla está activa
  useEffect(() => {
    if (isFocused && totalUnread > prevTotalUnreadRef.current) {
      debouncedPlaySound();
    }
    prevTotalUnreadRef.current = totalUnread;
  }, [totalUnread, isFocused, debouncedPlaySound]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    socketConnect();
    return () => {
      socketClose();
    };
  }, [socketConnect, socketClose]);

  const onSearch = () => {
    navigation.navigate('Search');
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Miniatura url={user?.miniatura} size={32} />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={onSearch}>
            <FontAwesomeIcon
              style={{ marginRight: 16 }}
              icon={faSearch}
              size={22}
              color="#00a2ed"
            />
          </TouchableOpacity>
        ),
        tabBarIcon: ({ color, size }) => {
          const icon = icons[route.name];
          return (
            <View style={{ position: 'relative' }}>
              <FontAwesomeIcon icon={icon} size={size} color={color} />
              {route.name === 'Amigos' && displayCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: 'red',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {displayCount}
                  </Text>
                </View>
              )}
              {route.name === 'Solicitudes' && newRequestsCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -10,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: 'red',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {newRequestsCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: '#00a2ed',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Solicitudes" component={RequestScreen} />
      <Tab.Screen name="Amigos" component={FriendsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default HomeScreen;













