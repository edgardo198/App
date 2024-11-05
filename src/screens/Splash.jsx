import React, { useEffect, useLayoutEffect } from 'react';
import { Animated, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import Title from '../common/Title';

function SplashScreen( { navigation } ) {
    
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false
        })
    }, [])

    const [fontsLoaded] = useFonts({
        'IBMPlexSans-Bold': require('../assets/fonts/IBMPlexSans-Bold.ttf'),
    });

    const translateY = new Animated.Value(0); 

    useEffect(() => {
        if (fontsLoaded) {
            
            Animated.loop(
                Animated.sequence([
                    Animated.timing(translateY, {
                        toValue: 50, 
                        duration: 600, 
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateY, {
                        toValue: 0, 
                        bounciness: 10, 
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null; 
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={'light-content'} />
            <Animated.View style={{ transform: [{ translateY }] }}>
                <Title />
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0078D7', 
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SplashScreen;











