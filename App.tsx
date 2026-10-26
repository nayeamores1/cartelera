import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarteleraProvider } from './src/context/CarteleraContext';
import { AppNavigator } from './src/navigation/AppNavigator';
export default function App() {
  return <SafeAreaProvider><CarteleraProvider><StatusBar style="light" /><AppNavigator /></CarteleraProvider></SafeAreaProvider>;
}
