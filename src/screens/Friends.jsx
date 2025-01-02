import React from 'react';
import { ActivityIndicator, FlatList, View, Text, TouchableOpacity } from 'react-native'; 
import { useNavigation } from '@react-navigation/native'; 
import Cell from '../common/Cell';
import Empty from '../common/Empty';
import useGlobal from '../core/global';
import Miniatura from '../common/Miniatura';
import { formatTime } from '../core/utils';


function FriendRow({ item }) {
    const navigation = useNavigation(); 
    return (
        <TouchableOpacity onPress={() => {
            navigation.navigate('Messages', item);
        }}>
            <Cell>
                <Miniatura 
                    url={item.friend.miniatura} 
                    size={76} 
                />
                <View style={{
                    flex: 1,
                    paddingHorizontal: 16,
                }}>
                    <Text style={{
                        fontWeight: 'bold',
                        color: '#202020',
                        marginBottom: 4,
                    }}>
                        {item.friend.name}
                    </Text>
                    <Text style={{
                        color: '#202020',
                    }}>
                        {item.preview} 
                        <Text style={{ color: '#909090', fontSize: 13 }}> { formatTime(item.updated) }</Text>
                    </Text>
                </View>
            </Cell>
        </TouchableOpacity>
    );
}

function FriendsScreen({ navigation }) { 
    const friendList = useGlobal(state => state.friendList);

    if (friendList === null) {
        return (
            <ActivityIndicator style={{ flex: 1 }} />
        );
    }

    if (friendList.length === 0) {
        return (
            <Empty icon="inbox" message="Sin mensajes" />
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={friendList}
                renderItem={({ item }) => (
                    <FriendRow item={item} /> 
                )}
                keyExtractor={(item, index) => 
                    item.username ? item.username : index.toString()
                }
            />
        </View>
    );
}

export default FriendsScreen;

