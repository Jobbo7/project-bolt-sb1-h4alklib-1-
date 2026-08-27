import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#070A12' }}>
      <StatusBar barStyle="light-content" backgroundColor="#070A12" />
      <WebView 
        source={{ uri: 'https://vercel.app' }} 
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}
