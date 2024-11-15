import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPen, faSignOutAlt, faCamera, faImages } from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import useGlobal from '../core/global';
import styles from '../Styles/styles';
import utils from '../core/utils';

function ProfileImage() {
    const uploadMiniatura = useGlobal(state => state.uploadMiniatura);

    const [profileImage, setProfileImage] = useState(require('../assets/kisspng-portable-.png'));
    const [isModalVisible, setModalVisible] = useState(false);

    const pickImage = async (fromCamera = false) => {
        const permissionResult = fromCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert(
                "Permiso requerido",
                `Se necesita permiso para acceder a tu ${fromCamera ? 'cámara' : 'galería de fotos'}.`
            );
            return;
        }

        const result = fromCamera
            ? await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
                base64: true,
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
                base64: true,
            });

        if (!result.canceled && result.assets && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            const imageBase64 = result.assets[0].base64;

            // Actualiza la imagen de perfil
            setProfileImage({ uri: imageUri });

            // Llama a uploadMiniatura para cargar la imagen
            uploadMiniatura(imageBase64);
        }

        setModalVisible(false);
    };

    return (
        <View>
            <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => setModalVisible(true)}>
                <Image
                    source={profileImage}
                    style={{
                        width: 160,
                        height: 160,
                        borderRadius: 80,
                        backgroundColor: '#cceeff',
                    }}
                />
                <View
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: '#0078d4',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 3,
                        borderColor: '#e6f7ff',
                    }}
                >
                    <FontAwesomeIcon icon={faPen} size={15} color="#d0d0d0" />
                </View>
            </TouchableOpacity>

            {/* Modal para seleccionar opción de imagen */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity style={styles.optionButton} onPress={() => pickImage(false)}>
                            <FontAwesomeIcon icon={faImages} size={20} color="#0078d4" />
                            <Text style={styles.optionText}>Galería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionButton} onPress={() => pickImage(true)}>
                            <FontAwesomeIcon icon={faCamera} size={20} color="#0078d4" />
                            <Text style={styles.optionText}>Cámara</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.optionText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function ProfileLogout() {
    const logout = useGlobal(state => state.logout);

    return (
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#ffffff" style={{ marginRight: 12 }} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
    );
}

function ProfileScreen() {
    const user = useGlobal(state => state.user);

    return (
        <View style={styles.profileContainer}>
            <ProfileImage />
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userUsername}>{user.username}</Text>
            <ProfileLogout />
        </View>
    );
}

export default ProfileScreen;











