import { Stack }          from 'expo-router';
import { StatusBar }      from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#05050f' }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#05050f" />
        <Stack
          screenOptions={{
            headerStyle:      { backgroundColor: '#05050f' },
            headerTintColor:  '#f0f0ff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle:     { backgroundColor: '#05050f' },
          }}
        >
          <Stack.Screen name="index"    options={{ title: 'Vibe Broker 🎙️' }} />
          <Stack.Screen name="history"  options={{ title: 'Historial' }} />
          <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
