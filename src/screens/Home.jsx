import React, { useEffect, useLayoutEffect } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faInbox, faUser, faUserFriends, faSearch } from '@fortawesome/free-solid-svg-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';

import RequestScreen from './Requests';
import FriendsScreen from './Friends';
import ProfileScreen from './Profile';

const Tab = createBottomTabNavigator();

const icons = {
  Solicitudes: faInbox, // Cambiado de "Chats" a "Solicitudes"
  Amigos: faUserFriends,
  Perfil: faUser,
};

function HomeScreen({ navigation }) {
  const socketConnect = useGlobal(state => state.socketConnect);
  const socketClose = useGlobal(state => state.socketClose);
  const user = useGlobal(state => state.user);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    socketConnect();
    return () => {
      socketClose();
    };
  }, [socketConnect, socketClose]);

  function onSearch() {
    navigation.navigate('Search');
  }

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
          return <FontAwesomeIcon icon={icon} size={size} color={color} />;
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
}

export default HomeScreen;





