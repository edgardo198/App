import React, { useLayoutEffect, useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View,TouchableWithoutFeedback,Keyboard, KeyboardAvoidingView } from 'react-native';
import { useFonts } from 'expo-font';
import Title from '../common/Title';
import styles from '../Styles/styles';
import api from '../core/api';
import utils from '../core/utils';
import useGlobal from '../core/global';

function Input({ title, value, error, setValue, setError, secureTextEntry = false }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: error ? '#ff7c80' : 'white' }]}>
        {error ? error : title}
      </Text>
      <TextInput
        style={[styles.textInput, { borderColor: error ? '#ff7c80' : 'white' }]}
        placeholder={title}
        placeholderTextColor="#aaa"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) setError('');
        }}
      />
    </View>
  );
}

function Button({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function SignUpScreen({ navigation }) {
  const [Usuario, setUsuario] = useState('');
  const [Nombre, setNombre] = useState('');
  const [Apellido, setApellido] = useState('');
  const [Contraseña, setContraseña] = useState('');
  const [ConfirmarContraseña, setConfirmarContraseña] = useState('');

  const [UsuarioError, setUsuarioError] = useState('');
  const [NombreError, setNombreError] = useState('');
  const [ApellidoError, setApellidoError] = useState('');
  const [ContraseñaError, setContraseñaError] = useState('');
  const [ConfirmarContraseñaError, setConfirmarContraseñaError] = useState('');

  const login =useGlobal(state => state.login)

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

  function onSignUp() {
    console.log('onSignUp', Usuario,Nombre,Apellido,Contraseña)
    let isValid = true;

    if (!Usuario) {
      setUsuarioError('Ingresa un Usuario válido');
      isValid = false;
    }

    if (!Nombre) {
      setNombreError('Ingresa un Nombre válido');
      isValid = false;
    }

    if (!Apellido) {
      setApellidoError('Ingresa un Apellido válido');
      isValid = false;
    }

    if (!Contraseña) {
      setContraseñaError('Ingresa una Contraseña válida');
      isValid = false;
    }

    if (Contraseña !== ConfirmarContraseña) {
      setConfirmarContraseñaError('Las contraseñas no coinciden');
      isValid = false;
    }

    api({
      method: 'POST',
      url: '/chat/signup/',
      data: {
          username: Usuario,
          first_name: Nombre,
          last_name: Apellido,
          password: Contraseña,
      }
  })
    .then(response => {
      utils.log('Sign Up:', response.data);
      const credentials ={
        username: Usuario,
        password: Contraseña
      }
      login(
        Credentials,
        response.data.user)
    })
    .catch(error => {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log('Error', error.message);
      }
      console.log(error.config);
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior='height' style={{flex:1}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.innerContainer}>
        <Title />
        <Input
          title="Usuario"
          value={Usuario}
          error={UsuarioError}
          setValue={setUsuario}
          setError={setUsuarioError}
        />
        <Input
          title="Nombre"
          value={Nombre}
          error={NombreError}
          setValue={setNombre}
          setError={setNombreError}
        />
        <Input
          title="Apellido"
          value={Apellido}
          error={ApellidoError}
          setValue={setApellido}
          setError={setApellidoError}
        />
        <Input
          title="Contraseña"
          value={Contraseña}
          error={ContraseñaError}
          setValue={setContraseña}
          setError={setContraseñaError}
          secureTextEntry={true}
        />
        <Input
          title="Confirmar Contraseña"
          value={ConfirmarContraseña}
          error={ConfirmarContraseñaError}
          setValue={setConfirmarContraseña}
          setError={setConfirmarContraseñaError}
          secureTextEntry={true}
        />
        <Button title="Registrarse" onPress={onSignUp} />
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.registerButton}>
          <Text style={styles.registerText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUpScreen;


