import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';
import { UserRole } from '../../types/clearpass';
import schoolLogo from '../../assets/images/sia_school_logo.jpg';

interface Props {
  onSuccess?: () => void;
  allowedRoles?: UserRole[];
}

export const LoginScreenRN: React.FC<Props> = ({ onSuccess, allowedRoles = ['Student', 'Personnel'] }) => {
  const { authenticateUser, syncError } = useClearPass();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!username.trim()) {
      setErrorMsg('Palihog og butang sa imong Username.');
      return;
    }

    const result = await authenticateUser(username, password, allowedRoles);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Invalid credentials. Check your assigned username and password with the school administrator.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Top SIA Badge (Figure 22) */}
      <View style={styles.topBadgeContainer}>
        <Image source={schoolLogo as any} style={styles.siaLogo} resizeMode="contain" />
      </View>

      {/* Header Titles */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to SIA ClearPass</Text>
        <Text style={styles.subtitleText}>St. Isidore Academy of Trinidad Bohol, Inc.</Text>
        <Text style={styles.appNameText}>Student & Personnel Clearance Mobile App</Text>
      </View>

      {/* Security Notice */}
      {syncError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Database/realtime sync issue: {syncError}</Text>
        </View>
      ) : null}

      <View style={styles.securityBox}>
        <Text style={styles.securityTitle}>🔒 Official School Credentials</Text>
        <Text style={styles.securityText}>
          Accounts are provisioned by the School Administration.
          Students: Sign in with your LRN or administrator-set username and password.
        </Text>
      </View>

      {/* Unified Login Form (No manual role switcher) */}
      <View style={styles.formContainer}>
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Username Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Username or Employee/Student ID</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your assigned username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.inputLabel}>Password</Text>
            <Text style={styles.inputHint}>Students: Last 4 of LRN</Text>
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Submit Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        One sign-in for students and personnel. Your role opens the matching dashboard.
      </Text>
      {Platform.OS === 'web' ? (
        <TouchableOpacity onPress={() => { if (typeof window !== 'undefined') window.location.href = '/admin'; }}>
          <Text style={styles.adminLink}>Administrator web sign-in</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBadgeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  siaCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e3a8a',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  siaLogo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  siaText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  appNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 4,
  },
  securityBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  securityText: {
    fontSize: 10,
    color: '#3b82f6',
    lineHeight: 14,
  },
  formContainer: {
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  loginButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  presetSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  presetHeader: {
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetGrid: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  presetCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  presetRolePillStudent: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  presetRoleTextStudent: {
    color: '#1e40af',
    fontSize: 9,
    fontWeight: '800',
  },
  presetRolePillPersonnel: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  presetRoleTextPersonnel: {
    color: '#6b21a8',
    fontSize: 9,
    fontWeight: '800',
  },
  presetName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  presetMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  presetPass: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
  footerNote: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
  },
  adminLink: {
    color: '#1e3a8a',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
});
