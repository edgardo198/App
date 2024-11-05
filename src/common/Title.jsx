import React from 'react';
import { Text, StyleSheet } from 'react-native';

function Title() {
    return (
        <Text style={styles.title}>
            Mensajeria
        </Text>
    );
}

const styles = StyleSheet.create({
    title: {
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 50,
        fontFamily: 'IBMPlexSans-Bold',
        marginTop: 0, 
    },
});

export default Title;


