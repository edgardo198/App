import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#00a2ed',
      padding: 20,
    },
    innerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    inputContainer: {
      marginVertical: 10,
      width: '100%',
    },
    inputLabel: {
      color:'white',
      marginVertical: 6,
      paddingLeft: 16,
      fontWeight: 'bold',
    },
    textInput: {
      backgroundColor: '#fff',
      borderRadius: 26,
      height: 52,
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#333',
      borderWidth: 1,
      borderColor: '#ddd',
      width: '100%',
    },
    buttonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    button: {
      backgroundColor: '#007bff',
      borderRadius: 26,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%', 
      marginTop: 20,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    registerButton: {
      color:'white',
      marginTop: 20,
    },
    registerText: {
      color: 'white',
      fontSize: 16,
      textDecorationLine: 'underline',
    },
  });

  export default styles;