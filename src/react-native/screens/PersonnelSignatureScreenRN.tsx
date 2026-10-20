import React, { useMemo, useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';

interface Props { onBack: () => void }
type Point = { x: number; y: number };
type Stroke = Point[];
const padWidth = 320;
const padHeight = 180;
const signaturePrefix = 'sia-signature:';

const lineSegments = (strokes: Stroke[]) => strokes.flatMap((stroke, strokeIndex) => stroke.slice(1).map((point, pointIndex) => {
  const prior = stroke[pointIndex];
  const dx = point.x - prior.x;
  const dy = point.y - prior.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    key: `${strokeIndex}-${pointIndex}`,
    style: {
      left: (prior.x + point.x) / 2 - length / 2,
      top: (prior.y + point.y) / 2 - 1.5,
      width: Math.max(length, 2),
      transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
    },
  };
}));

const parseSignature = (value: string): Stroke[] | null => {
  if (!value.startsWith(signaturePrefix)) return null;
  try {
    const strokes: unknown = JSON.parse(value.slice(signaturePrefix.length));
    return Array.isArray(strokes) ? strokes as Stroke[] : null;
  } catch { return null; }
};

export const PersonnelSignatureScreenRN: React.FC<Props> = ({ onBack }) => {
  const { currentPersonnel, signatures, saveSignature } = useClearPass();
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const teacher = currentPersonnel;
  const currentSig = signatures.find(signature => signature.personnel_id === teacher?.personnel_id);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      const { locationX, locationY } = event.nativeEvent;
      setStrokes(previous => [...previous, [{ x: Math.max(0, Math.min(padWidth, locationX)), y: Math.max(0, Math.min(padHeight, locationY)) }]]);
      setSavedSuccess(false);
    },
    onPanResponderMove: event => {
      const { locationX, locationY } = event.nativeEvent;
      const point = { x: Math.max(0, Math.min(padWidth, locationX)), y: Math.max(0, Math.min(padHeight, locationY)) };
      setStrokes(previous => {
        if (!previous.length) return [[point]];
        const next = [...previous];
        next[next.length - 1] = [...next[next.length - 1], point];
        return next;
      });
    },
  }), []);

  const save = () => {
    if (!teacher || !strokes.some(stroke => stroke.length > 1)) return;
    saveSignature(teacher.personnel_id, `${signaturePrefix}${JSON.stringify(strokes)}`);
    setSavedSuccess(true);
  };

  const savedVector = currentSig ? parseSignature(currentSig.signature_data) : null;
  const savedSegments = savedVector ? lineSegments(savedVector) : [];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backButtonText}>←</Text></Pressable>
        <Text style={styles.headerTitle}>Digital Signature</Text>
        <View style={styles.siaPill}><Text style={styles.siaPillText}>SIA</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Register your signature here.</Text>
        <Text style={styles.subtitle}>Use your fingertip or mouse to sign within the box. Your saved signature is attached to clearances you approve.</Text>
        <View style={styles.canvasCard}>
          <View style={styles.pad} {...responder.panHandlers}>
            {lineSegments(strokes).map(line => <View key={line.key} pointerEvents="none" style={[styles.ink, line.style]} />)}
            <View pointerEvents="none" style={styles.baseline} />
          </View>
          <Text style={styles.guide}>Sign above the baseline · Official SIA Digital Signature Pad</Text>
        </View>
        <View style={styles.buttonRow}>
          <Pressable onPress={() => { setStrokes([]); setSavedSuccess(false); }} style={[styles.button, styles.buttonLight]}><Text style={styles.lightText}>Clear</Text></Pressable>
          <Pressable onPress={save} style={styles.button}><Text style={styles.buttonText}>Save signature</Text></Pressable>
        </View>
        {savedSuccess && <View style={styles.success}><Text style={styles.successText}>✓ Digital signature registered and ready to sign clearances.</Text></View>}
        {currentSig && <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>Currently registered signature</Text>
          <View style={styles.preview}>
            {savedVector ? savedSegments.map(line => <View key={line.key} pointerEvents="none" style={[styles.ink, line.style]} />)
              : <Image source={{ uri: currentSig.signature_data }} style={styles.imagePreview} resizeMode="contain" />}
          </View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Verification code</Text><Text style={styles.metaValue}>{currentSig.verification_code}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Status</Text><Text style={styles.activeText}>ACTIVE & VERIFIED</Text></View>
        </View>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 6 }, backButtonText: { fontSize: 21, color: '#1e3a8a', fontWeight: '800' }, headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  siaPill: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }, siaPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  content: { padding: 18, paddingBottom: 36, width: '100%', maxWidth: 680, alignSelf: 'center' }, title: { fontSize: 17, fontWeight: '800', color: '#0f172a' }, subtitle: { fontSize: 11, color: '#64748b', marginTop: 5, lineHeight: 17 },
  canvasCard: { backgroundColor: '#fff', borderRadius: 15, padding: 13, borderWidth: 1, borderColor: '#dbe3ef', marginTop: 16, alignItems: 'center' },
  pad: { width: '100%', maxWidth: padWidth, height: padHeight, backgroundColor: '#fff', borderRadius: 9, borderWidth: 1, borderStyle: 'dashed', borderColor: '#93a8cf', overflow: 'hidden', position: 'relative' },
  ink: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#1e3a8a' }, baseline: { position: 'absolute', left: 14, right: 14, bottom: 34, height: 1, backgroundColor: '#dbe3ef' },
  guide: { fontSize: 10, color: '#94a3b8', marginTop: 9, textAlign: 'center' }, buttonRow: { flexDirection: 'row', gap: 10, marginTop: 13 }, button: { flex: 1, minHeight: 43, backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, buttonLight: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }, buttonText: { fontSize: 12, color: '#fff', fontWeight: '800' }, lightText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  success: { backgroundColor: '#dcfce7', padding: 11, borderRadius: 9, marginTop: 12, borderWidth: 1, borderColor: '#bbf7d0' }, successText: { color: '#15803d', textAlign: 'center', fontSize: 11, fontWeight: '700' },
  savedCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 17 }, savedTitle: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 9 }, preview: { height: 100, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', position: 'relative', marginBottom: 9 }, imagePreview: { width: '100%', height: '100%' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }, metaLabel: { fontSize: 10, color: '#64748b' }, metaValue: { fontSize: 10, fontWeight: '700', color: '#1e3a8a', fontFamily: 'monospace' }, activeText: { fontSize: 10, color: '#15803d', fontWeight: '800' },
});
