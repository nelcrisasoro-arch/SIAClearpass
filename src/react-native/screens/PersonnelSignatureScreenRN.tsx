import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useClearPass } from '../../context/ClearPassContext';

interface Props {
  onBack: () => void;
}

export const PersonnelSignatureScreenRN: React.FC<Props> = ({ onBack }) => {
  const { currentPersonnel, signatures, saveSignature } = useClearPass();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const teacher = currentPersonnel;
  const currentSig = signatures.find(s => s.personnel_id === teacher?.personnel_id);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSavedSuccess(false);
  };

  const handleSave = () => {
    if (!teacher) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    saveSignature(teacher.personnel_id, dataUrl);
    setSavedSuccess(true);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Signature</Text>
        <View style={styles.siaPill}>
          <Text style={styles.siaPillText}>SIA</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
        <View style={styles.instructionsBox}>
          <Text style={styles.titleText}>Register your signature here.</Text>
          <Text style={styles.subtitleText}>
            Use your fingertip or stylus pen to sign within the box. This will be officially embedded on all student clearance forms you approve.
          </Text>
        </View>

        {/* Signature Pad Canvas Container (Figure 27) */}
        <View style={styles.canvasContainer}>
          <div className="w-full flex items-center justify-center p-2 bg-slate-50 rounded-xl border-2 border-dashed border-blue-900/30">
            <canvas
              ref={canvasRef}
              width={320}
              height={180}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="bg-white rounded-lg shadow-inner cursor-crosshair touch-none w-full max-w-[320px] h-[180px]"
            />
          </div>
          <Text style={styles.guideText}>Sign above the baseline · Official SIA Digital Signature Pad</Text>
        </View>

        {/* Action Buttons: Clear, Save, Edit (Figure 27) */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {savedSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              ✓ Digital signature registered successfully and ready to sign clearances!
            </Text>
          </View>
        )}

        {/* Currently Registered Signature Card */}
        {currentSig && (
          <View style={styles.activeSignatureCard}>
            <Text style={styles.activeSigHeader}>Currently Registered Signature</Text>
            <View style={styles.signaturePreviewBox}>
              <img
                src={currentSig.signature_data}
                alt="Registered Signature"
                className="max-h-16 object-contain mx-auto"
              />
            </View>

            <View style={styles.sigMetaRow}>
              <Text style={styles.sigMetaLabel}>Verification Code:</Text>
              <Text style={styles.sigMetaCode}>{currentSig.verification_code}</Text>
            </View>

            <View style={styles.sigMetaRow}>
              <Text style={styles.sigMetaLabel}>Status:</Text>
              <Text style={styles.sigMetaStatus}>ACTIVE & VERIFIED</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  siaPill: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  siaPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
    padding: 16,
  },
  instructionsBox: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  canvasContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successBannerText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    textAlign: 'center',
  },
  activeSignatureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  activeSigHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  signaturePreviewBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 10,
  },
  sigMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sigMetaLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  sigMetaCode: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e3a8a',
    fontFamily: 'monospace',
  },
  sigMetaStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
});
