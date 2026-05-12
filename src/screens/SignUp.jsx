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
import WebBackButton from '../common/WebBackButton';
import styles from '../Styles/styles';
import api from '../core/api';
import useGlobal from '../core/global';
import { log } from '../core/utils';

function normalizeApiError(data) {
  if (!data) {
    return 'No se pudo completar el registro.';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.join('\n');
  }

  if (typeof data === 'object') {
    const fieldLabels = {
      username: 'Usuario',
      first_name: 'Nombre',
      last_name: 'Apellido',
      password: 'Contrasena',
      detail: 'Detalle',
      non_field_errors: 'Detalle',
    };

    return Object.entries(data)
      .map(([field, value]) => {
        const text = Array.isArray(value) ? value.join(', ') : String(value);
        const label = fieldLabels[field] || field;
        return field === 'detail' ? text : `${label}: ${text}`;
      })
      .join('\n');
  }

  return 'No se pudo completar el registro.';
}

function SignUpScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  const [usuarioError, setUsuarioError] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [contrasenaError, setContrasenaError] = useState('');
  const [confirmarContrasenaError, setConfirmarContrasenaError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useGlobal((state) => state.login);
  const nombreRef = useRef(null);
  const apellidoRef = useRef(null);
  const contrasenaRef = useRef(null);
  const confirmarRef = useRef(null);

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

  async function onSignUp() {
    let isValid = true;

    const normalizedUsuario = usuario.trim();
    const normalizedNombre = nombre.trim();
    const normalizedApellido = apellido.trim();

    if (!normalizedUsuario) {
      setUsuarioError('Ingresa un usuario valido');
      isValid = false;
    }

    if (!normalizedNombre) {
      setNombreError('Ingresa un nombre valido');
      isValid = false;
    }

    if (!normalizedApellido) {
      setApellidoError('Ingresa un apellido valido');
      isValid = false;
    }

    if (!contrasena) {
      setContrasenaError('Ingresa una contrasena valida');
      isValid = false;
    } else if (contrasena.length < 8) {
      setContrasenaError('Usa al menos 8 caracteres');
      isValid = false;
    }

    if (!confirmarContrasena) {
      setConfirmarContrasenaError('Confirma la contrasena');
      isValid = false;
    } else if (contrasena !== confirmarContrasena) {
      setConfirmarContrasenaError('Las contrasenas no coinciden');
      isValid = false;
    }

    if (!isValid || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api({
        method: 'POST',
        url: '/chat/signup/',
        data: {
          username: normalizedUsuario,
          first_name: normalizedNombre,
          last_name: normalizedApellido,
          password: contrasena,
        },
      });

      log('Sign up:', response.data);
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

      Alert.alert('No se pudo registrar', message);
      console.error('SignUp error:', error.response?.data || error.message || error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
        <DismissKeyboardView style={styles.innerContainer}>
          <View style={styles.authForm}>
            <WebBackButton navigation={navigation} fallbackRoute="SignIn" style={styles.authBackButton} />
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
              onSubmitEditing={() => nombreRef.current?.focus()}
              blurOnSubmit={false}
              autoFocus
            />
            <Input
              title="Nombre"
              value={nombre}
              error={nombreError}
              setValue={setNombre}
              setError={setNombreError}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name-given"
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => apellidoRef.current?.focus()}
              blurOnSubmit={false}
              inputRef={nombreRef}
            />
            <Input
              title="Apellido"
              value={apellido}
              error={apellidoError}
              setValue={setApellido}
              setError={setApellidoError}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name-family"
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => contrasenaRef.current?.focus()}
              blurOnSubmit={false}
              inputRef={apellidoRef}
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
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmarRef.current?.focus()}
              blurOnSubmit={false}
              inputRef={contrasenaRef}
            />
            <Input
              title="Confirmar Contrasena"
              value={confirmarContrasena}
              error={confirmarContrasenaError}
              setValue={setConfirmarContrasena}
              setError={setConfirmarContrasenaError}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={onSignUp}
              inputRef={confirmarRef}
            />
            <Button
              title={isLoading ? 'Registrando...' : 'Registrarse'}
              onPress={onSignUp}
              disabled={isLoading}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('SignIn')}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>Ya tienes cuenta? Inicia sesion</Text>
            </TouchableOpacity>
          </View>
        </DismissKeyboardView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUpScreen;
