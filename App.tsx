import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { StoriesProvider } from './src/contexts/StoriesContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Injecter le CSS directement dans la page
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body, #root {
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        #root {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        /* Forcer le scroll sur web */
        .web-scroll-container {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          height: 100%;
        }
        /* Scrollbar stylisée */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #16112A;
        }
        ::-webkit-scrollbar-thumb {
          background: #7C5CBF;
          border-radius: 3px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : undefined }}>
      <AuthProvider>
        <StoriesProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </StoriesProvider>
      </AuthProvider>
    </View>
  );
}
