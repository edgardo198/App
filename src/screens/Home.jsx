import React, { useEffect, useLayoutEffect } from 'react';
import { View, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faInbox, faUser, faUserFriends, faSearch } from '@fortawesome/free-solid-svg-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import useGlobal from '../core/global';

import RequestScreen from './Requests';
import FriendsScreen from './Friends';
import ProfileScreen from './Profile';

const Tab = createBottomTabNavigator();
const profileImage = require('../assets/kisspng-portable-.png');

const icons = {
  Chats: faInbox,
  Amigos: faUserFriends,
  Perfil: faUser,
};

function HomeScreen({ navigation }) {
  const socketConnect = useGlobal(state => state.socketConnect);
  const socketClose = useGlobal(state => state.socketClose);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    socketConnect();
    return () => {
      socketClose();
    };
  }, [socketConnect, socketClose]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <Image
              source={profileImage}
              style={{ width: 30, height: 30, borderRadius: 15 }}
            />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => console.log('Search button pressed')}>
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
      <Tab.Screen name="Chats" component={RequestScreen} />
      <Tab.Screen name="Amigos" component={FriendsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default HomeScreen;





