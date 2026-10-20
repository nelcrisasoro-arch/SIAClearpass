import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { ClearPassProvider } from '../context/ClearPassContext';
import { MobileAppRootRN } from './MobileAppRootRN';
import AdminPortalScreenRN from './screens/AdminPortalScreenRN';

const ApplicationRN: React.FC = () => {
  if (Platform.OS === 'web') return <AdminPortalScreenRN />;

  return <MobileAppRootRN />;
};

const AppRootRN: React.FC = () => (
  <ClearPassProvider>
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}><ApplicationRN /></View>
    </SafeAreaView>
  </ClearPassProvider>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, minHeight: '100%', backgroundColor: '#f4f7fc' },
  container: { flex: 1, minHeight: '100%' },
});

export default AppRootRN;
