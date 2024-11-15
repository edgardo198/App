import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    // Estilos generales existentes
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
        color: 'white',
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
        color: 'white',
        marginTop: 20,
    },
    registerText: {
        color: 'white',
        fontSize: 16,
        textDecorationLine: 'underline',
    },

    // Estilos para ProfileScreen
    profileContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 80,
        backgroundColor: '#e6f7ff',
    },
    userName: {
        textAlign: 'center',
        color: '#0078d4',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    userUsername: {
        textAlign: 'center',
        color: '#6ba4c8',
        fontSize: 16,
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 26,
        backgroundColor: '#00a2ed',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    logoutText: {
        fontWeight: 'bold',
        color: '#ffffff',
        fontSize: 16,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: 300,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
    },
    optionText: {
        fontSize: 18,
        color: '#0078d4',
        marginLeft: 10,
    },

    // Estilos para la pantalla de inicio de sesión (SignInScreen)
    signInContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    signInInnerContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInRegisterButton: {
        marginTop: 10,
    },
    signInRegisterText: {
        color: '#007BFF',
    },
    signInModalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInModalText: {
        fontSize: 18,
        marginTop: 10,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#ff4d4d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: 300,
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },  
});

export default styles;

