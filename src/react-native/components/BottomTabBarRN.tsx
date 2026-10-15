import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface StudentTabBarProps {
  currentTab: 'requirements' | 'home' | 'records' | 'notifications' | 'profile';
  onSelectTab: (tab: 'requirements' | 'home' | 'records' | 'notifications' | 'profile') => void;
}

export const StudentTabBarRN: React.FC<StudentTabBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.tabBarContainer}>
      {/* Tab 1: Requirements */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('requirements')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'requirements' && styles.tabIconActive]}>
          📋
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'requirements' && styles.tabLabelActive]}>
          Requirements
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Home */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'home' && styles.tabIconActive]}>
          🏠
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'home' && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Tab 3: Records */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('records')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'records' && styles.tabIconActive]}>
          📂
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'records' && styles.tabLabelActive]}>
          Records
        </Text>
      </TouchableOpacity>

      {/* Tab 4: Profile */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'profile' && styles.tabIconActive]}>
          👤
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'profile' && styles.tabLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface PersonnelTabBarProps {
  currentTab: 'requirements' | 'submissions' | 'home' | 'signature' | 'records' | 'profile';
  onSelectTab: (tab: 'requirements' | 'submissions' | 'home' | 'signature' | 'records' | 'profile') => void;
}

export const PersonnelTabBarRN: React.FC<PersonnelTabBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('requirements')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'requirements' && styles.tabIconActive]}>
          📋
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'requirements' && styles.tabLabelActive]}>
          Reqs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('submissions')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'submissions' && styles.tabIconActive]}>
          📥
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'submissions' && styles.tabLabelActive]}>
          Reviews
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'home' && styles.tabIconActive]}>
          🏠
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'home' && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('signature')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'signature' && styles.tabIconActive]}>
          ✍️
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'signature' && styles.tabLabelActive]}>
          Sign
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onSelectTab('profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, currentTab === 'profile' && styles.tabIconActive]}>
          👤
        </Text>
        <Text style={[styles.tabLabel, currentTab === 'profile' && styles.tabLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
});
