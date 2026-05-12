import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import Title from '../common/Title';
import Button from '../common/Button';
import DismissKeyboardView from '../common/DismissKeyboardView';
import Input from '../common/Input';
import styles from '../Styles/styles';
import api from '../core/api';
import useGlobal from '../core/global';

function normalizeApiError(data) {
  if (!data) {
    return 'No se pudo iniciar sesion.';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join('\n');
  }

  if (typeof data === 'object') {
    const detail = data.detail;
    if (detail) {
      return Array.isArray(detail) ? detail.join('\n') : String(detail);
    }

    return Object.values(data)
      .flat()
      .map((value) => String(value))
      .join('\n');
  }

  return 'No se pudo iniciar sesion.';
}

function SignInScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [usuarioError, setUsuarioError] = useState('');
  const [contrasenaError, setContrasenaError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useGlobal((state) => state.login);
  const passwordRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [fontsLoaded] = useFonts({
    'IBMPlexSans-Bold': require('../assets/fonts/IBMPlexSans-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  async function onSignIn() {
    const normalizedUsuario = usuario.trim();
    let hasError = false;

    if (!normalizedUsuario) {
      setUsuarioError('Ingresa un usuario valido');
      hasError = true;
    }

    if (!contrasena) {
      setContrasenaError('Ingresa una contrasena');
      hasError = true;
    }

    if (hasError || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api({
        method: 'POST',
        url: '/chat/signin/',
        data: {
          username: normalizedUsuario,
          password: contrasena,
        },
      });

      await login(
        {
          username: normalizedUsuario,
          password: contrasena,
        },
        response.data.user,
        response.data.tokens
      );
    } catch (error) {
      const message = error.response
        ? normalizeApiError(error.response.data)
        : 'No se pudo conectar con el servidor. Verifica que el backend este encendido.';

      Alert.alert('No se pudo iniciar sesion', message);
      console.error('SignIn error:', error.response?.data || error.message || error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
        <DismissKeyboardView style={styles.innerContainer}>
          <View style={styles.authForm}>
            <View style={styles.authTitleContainer}>
              <Title />
            </View>
            <Input
              title="Usuario"
              value={usuario}
              error={usuarioError}
              setValue={setUsuario}
              setError={setUsuarioError}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              autoFocus
            />
            <Input
              title="Contrasena"
              value={contrasena}
              error={contrasenaError}
              setValue={setContrasena}
              setError={setContrasenaError}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={onSignIn}
              inputRef={passwordRef}
            />
            <Button
              title={isLoading ? 'Ingresando...' : 'Ingresar'}
              onPress={onSignIn}
              disabled={isLoading}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>No tienes cuenta? Registrate</Text>
            </TouchableOpacity>
          </View>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignInScreen;
