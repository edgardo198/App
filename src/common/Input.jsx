import { Text, TextInput, View } from 'react-native';
import styles from '../Styles/styles';

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
          onChangeText={text => {
            setValue(text);
            if (error) setError('');
          }}
        />
      </View>
    );
}

export default Input;
