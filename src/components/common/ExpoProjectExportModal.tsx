import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Smartphone, Download, FolderArchive, Play } from 'lucide-react';
import JSZip from 'jszip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpoProjectExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'app' | 'package' | 'appjson' | 'setup'>('setup');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const appTsxCode = `// SIA ClearPass: A Student Clearance Mobile App
// St. Isidore Academy of Trinidad Bohol, Inc.
// Built with React Native & Expo
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
} from 'react-native';

export default function App() {
  const [role, setRole] = useState<'Student' | 'Personnel'>('Student');
  const [currentTab, setCurrentTab] = useState<'home' | 'requirements' | 'records'>('home');
  const [progress, setProgress] = useState(70);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.siaBadge}>
          <Text style={styles.siaText}>SIA</Text>
        </View>
        <Text style={styles.headerTitle}>SIA ClearPass</Text>
        <Text style={styles.headerRole}>{role}</Text>
      </View>

      {/* Screen Body */}
      <ScrollView style={styles.content}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeTitle}>
            Welcome, {role === 'Student' ? 'Joseph (Grade 9 Rose)' : 'Mr. Nelcris Asoro (Science)'}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            SY: 2026-2027 · Clearance Period: March 1 - April 1
          </Text>
        </View>

        {/* Progress Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Clearance Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: \`\${progress}%\` }]} />
          </View>
          <Text style={styles.progressPercent}>{progress}% Completed</Text>
        </View>

        {/* Required Signatories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Required Signatories</Text>
          <View style={styles.row}>
            <Text style={styles.cellName}>Mr. Nelcris Asoro</Text>
            <Text style={styles.cellRole}>Science Teacher</Text>
            <Text style={styles.cellSigned}>Signed ✓</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellName}>Ms. Elena Santos</Text>
            <Text style={styles.cellRole}>Class Adviser</Text>
            <Text style={styles.cellSigned}>Signed ✓</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellName}>Ms. Lourdes Reyes</Text>
            <Text style={styles.cellRole}>Librarian</Text>
            <Text style={styles.cellSigned}>Signed ✓</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellName}>Ms. Carmelita Tan</Text>
            <Text style={styles.cellRole}>School Cashier</Text>
            <Text style={styles.cellPending}>Pending ⏳</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab('requirements')}>
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={styles.tabText}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab('home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabText, { color: '#1e3a8a', fontWeight: 'bold' }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => setCurrentTab('records')}>
          <Text style={styles.tabIcon}>📂</Text>
          <Text style={styles.tabText}>Records</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  siaBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  siaText: { color: '#ffffff', fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  headerRole: { fontSize: 12, color: '#64748b' },
  content: { flex: 1, padding: 16 },
  welcomeBox: { marginBottom: 16 },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  welcomeSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  progressBar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: '#1e3a8a' },
  progressPercent: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cellName: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  cellRole: { fontSize: 11, color: '#64748b' },
  cellSigned: { fontSize: 11, color: '#16a34a', fontWeight: '700' },
  cellPending: { fontSize: 11, color: '#d97706', fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20 },
  tabText: { fontSize: 10, color: '#64748b', marginTop: 2 },
});`;

  const packageJsonCode = `{
  "name": "sia-clearpass-mobile",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  },
  "private": true
}`;

  const appJsonCode = `{
  "expo": {
    "name": "SIA ClearPass",
    "slug": "sia-clearpass",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#1e3a8a"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.st_isidore.clearpass"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1e3a8a"
      },
      "package": "com.st_isidore.clearpass"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}`;

  const setupCommands = `# ==============================================================
# HOW TO RUN SIA CLEARPASS
# St. Isidore Academy of Trinidad Bohol, Inc.
# ==============================================================

### OPTION 1: RUN IN EXPO / REACT NATIVE (MOBILE APP)
1. Make sure you have Node.js installed (v18 or higher) from https://nodejs.org
2. Open terminal in the unzipped folder:
   cd sia-clearpass
3. Install dependencies:
   npm install
4. Start the Expo development server:
   npx expo start
5. Press:
   - 'a' to open on Android Emulator
   - 'i' to open on iOS Simulator
   - 'w' to open in Web Browser
   - Or scan the QR code using the "Expo Go" app on your physical iPhone or Android!

--------------------------------------------------------------

### OPTION 2: RUN AS FULL-STACK WEB & SIMULATOR
1. In the unzipped folder:
   npm install
2. Start the local server:
   npm run dev
3. Open your browser at:
   http://localhost:3000
`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'app':
        return appTsxCode;
      case 'package':
        return packageJsonCode;
      case 'appjson':
        return appJsonCode;
      case 'setup':
        return setupCommands;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Instant 1-Click ZIP Downloader using JSZip
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Project structure
      zip.file('App.tsx', appTsxCode);
      zip.file('package.json', packageJsonCode);
      zip.file('app.json', appJsonCode);
      zip.file('README.md', setupCommands);

      // tsconfig.json
      zip.file(
        'tsconfig.json',
        JSON.stringify(
          {
            extends: 'expo/tsconfig.base',
            compilerOptions: { strict: true },
          },
          null,
          2
        )
      );

      // Generate the ZIP blob
      const content = await zip.generateAsync({ type: 'blob' });

      // Trigger browser download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sia-clearpass-react-native-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Download & Run SIA ClearPass
              </h3>
              <p className="text-[11px] text-slate-400">
                St. Isidore Academy of Trinidad Bohol, Inc. · React Native & Expo Project
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Creating ZIP...' : 'Download ZIP'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>How to Run</span>
            </button>

            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                activeTab === 'app'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              App.tsx
            </button>

            <button
              onClick={() => setActiveTab('package')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                activeTab === 'package'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              package.json
            </button>

            <button
              onClick={() => setActiveTab('appjson')}
              className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors cursor-pointer ${
                activeTab === 'appjson'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              app.json
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre-wrap select-text">{getActiveCode()}</pre>
        </div>

        {/* Bottom Banner */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Click <b>Download ZIP</b> to download the ready-to-run React Native project archive.</span>
          </div>
          <button
            onClick={handleDownloadZip}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md shadow transition-colors cursor-pointer"
          >
            Download ZIP Now
          </button>
        </div>
      </div>
    </div>
  );
};
