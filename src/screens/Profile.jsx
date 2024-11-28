import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPen, faSignOutAlt, faCamera, faImages } from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import useGlobal from '../core/global';
import styles from '../Styles/styles';
import Miniatura from '../common/Miniatura';

function ProfileImage() {
    const uploadMiniatura = useGlobal(state => state.uploadMiniatura);
    const user = useGlobal(state => state.user);

    const [isModalVisible, setModalVisible] = useState(false);

    const pickImage = async (fromCamera = false) => {
        try {
            const permissionResult = fromCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert(
                    'Permiso requerido',
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

            if (!result.canceled && result.assets?.[0]) {
                const { uri, base64 } = result.assets[0];
                const fileName = uri.split('/').pop() || 'imagen_desconocida.png';

                // Actualiza la miniatura en el backend
                await uploadMiniatura({ base64, fileName });
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo procesar la imagen. Por favor, intenta de nuevo.');
        } finally {
            setModalVisible(false);
        }
    };

    return (
        <View>
            <TouchableOpacity style={styles.profileImageContainer} onPress={() => setModalVisible(true)}>
                <Miniatura url={user.miniatura} size={180} />
                <View style={styles.editIconContainer}>
                    <FontAwesomeIcon icon={faPen} size={15} color="#d0d0d0" />
                </View>
            </TouchableOpacity>

            {/* Modal para selección de imagen */}
            <Modal
                transparent
                animationType="fade"
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
            <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#ffffff" style={styles.iconMargin} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
    );
}

function ProfileScreen() {
    const user = useGlobal(state => state.user);

    return (
        <View style={styles.profileContainer}>
            <ProfileImage />
            <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.userUsername}>{user?.username || 'Sin nombre de usuario'}</Text>
            <ProfileLogout />
        </View>
    );
}

export default ProfileScreen;














