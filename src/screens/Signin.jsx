import React, { useLayoutEffect, useState } from 'react';
import styles from '../Styles/styles';
import { SafeAreaView, Text, TouchableWithoutFeedback, View, TouchableOpacity, Keyboard, KeyboardAvoidingView } from 'react-native';
import { useFonts } from 'expo-font';
import Title from '../common/Title';
import Button from '../common/Button';
import Input from '../common/Input';
import api from '../core/api';
import utils from '../core/utils';
import useGlobal from '../core/global';

function SignInScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [usuarioError, setUsuarioError] = useState('');
  const [contraseñaError, setContraseñaError] = useState('');

  const login = useGlobal(state => state.login);
  const showRegisterOption = true; 

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

  function onSignIn() {
    // Validación de campos
    const failUsuario = !usuario;
    const failContraseña = !contraseña;

    if (failUsuario) {
      setUsuarioError('Ingresa un Usuario');
    } else {
      setUsuarioError('');
    }

    if (failContraseña) {
      setContraseñaError('Ingresa una Contraseña');
    } else {
      setContraseñaError('');
    }

    if (failUsuario || failContraseña) return; // Salir si hay errores

    // Llamada a la API para iniciar sesión
    api({
      method: 'POST',
      url: '/chat/signin/',
      data: {
          username: usuario,
          password: contraseña,
      }
    })
    .then(response => {
      const credentials = {
        username: usuario,
        password: contraseña
      };
      utils.log('Sign In:', response.data);
      login(credentials, response.data.user);
    })
    .catch(error => {
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
      } else if (error.request) {
        console.error('Error de solicitud:', error.request);
      } else {
        console.error('Error', error.message);
      }
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior='height' style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <Title />
            <Input 
              title="Usuario"
              value={usuario}
              error={usuarioError}
              setValue={setUsuario}
              setError={setUsuarioError}
            />
            <Input 
              title="Contraseña"
              value={contraseña}
              error={contraseñaError}
              setValue={setContraseña}
              setError={setContraseñaError} 
              secureTextEntry={true} 
            />
            <Button 
              title="Ingresar" 
              onPress={onSignIn} 
            />
            {showRegisterOption && (
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.registerButton}>
                <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignInScreen;











