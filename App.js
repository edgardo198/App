import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/Splash';
import SignInScreen from './src/screens/Signin';
import SignUpScreen from './src/screens/SignUp';
import HomeScreen from './src/screens/Home';
import SearchScreen from './src/screens/Search';
import MessagesScreen from './src/screens/Messages';
import './src/core/fontawesome';
import useGlobal from './src/core/global';

// Define custom theme
const DefaultThemeBlue = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00a2ed',
    background: '#f0f8ff',
    card: '#ffffff',
    text: '#333333',
    border: '#c0c0c0',
    notification: '#00a2ed',
  },
};

const Stack = createStackNavigator();

export default function App() {
  const initialized = useGlobal(state => state.initialized);
  const authenticated = useGlobal(state => state.authenticated);
  const init = useGlobal(state => state.init);

  useEffect(() => {
    // Initialize app on mount
    init();
  }, [init]);

  return (
    <NavigationContainer theme={DefaultThemeBlue}>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Conditional rendering based on app state */}
        {!initialized ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !authenticated ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

