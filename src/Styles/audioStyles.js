import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#303040',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    width: '90%',
    alignSelf: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    color: '#f5f5f5',
    fontSize: 12,
    marginLeft: 10,
  },
});

