import React, { useRef, useState, useEffect } from 'react';
import { useClearPass } from '../../context/ClearPassContext';
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  X,
  ShieldCheck,
  QrCode,
  School,
  Award
} from 'lucide-react';
import { StudentProfile, ClearanceRecord } from '../../types/clearpass';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  record?: ClearanceRecord;
}

export const ClearanceCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  record,
}) => {
  const { signatories, signatures, personnel, getStudentProgress, activePeriod } = useClearPass();
  const printRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const progress = getStudentProgress(student.student_id);
  const isFullyCleared = progress.percentage === 100 || record?.overall_status === 'Cleared';

  // Format verification ID
  const certId = `SIA-CLR-${student.school_year.replace('-', '')}-${student.student_number.slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyVerif = () => {
    navigator.clipboard.writeText(certId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-800" />
            <h3 className="font-bold text-slate-800 text-base">Official Student Clearance Document</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Body */}
        <div className="p-8 overflow-y-auto" ref={printRef}>
          <div className="border-4 border-double border-slate-800 p-8 rounded-lg bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10 relative">
            {/* Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <School className="w-96 h-96 text-slate-900" />
            </div>

            {/* Header */}
            <div className="text-center border-b-2 border-slate-300 pb-5 mb-6 relative">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img
                  src="/src/assets/images/sia_school_logo.jpg"
                  alt="St. Isidore Academy school logo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-900 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-lg font-extrabold uppercase tracking-wide text-blue-950 font-serif">
                    St. Isidore Academy of Trinidad Bohol, Inc.
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">Poblacion, Trinidad, Bohol, Philippines · Founded 1968</p>
                  <p className="text-[11px] font-semibold text-blue-900 tracking-wider uppercase mt-0.5">
                    Office of the Registrar & Student Services
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-block bg-blue-900 text-white font-bold text-xs uppercase tracking-widest px-4 py-1 rounded">
                Official Certificate of Student Clearance
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Academic Year {student.school_year} · {activePeriod?.term || 'Second Semester'}
              </p>
            </div>

            {/* Student Metadata Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-6">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Student Name</span>
                <span className="font-bold text-slate-800 uppercase">
                  {student.last_name}, {student.first_name} {student.middle_name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">LRN / Student No.</span>
                <span className="font-mono font-bold text-slate-800">{student.student_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Grade & Section</span>
                <span className="font-semibold text-slate-800">
                  {student.grade_level} - {student.section}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Clearance Status</span>
                <span className={`inline-flex items-center gap-1 font-bold ${isFullyCleared ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isFullyCleared ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {isFullyCleared ? 'CLEARED & APPROVED' : `${progress.percentage}% IN PROGRESS`}
                </span>
              </div>
            </div>

            {/* Certifying Statement */}
            <p className="text-xs text-slate-700 leading-relaxed mb-6 text-justify">
              This is to officially certify that the student named above has complied with all academic,
              property, financial, and institutional obligations to St. Isidore Academy of Trinidad Bohol, Inc. for the
              specified period as confirmed by the respective department heads and clearance signatories below.
            </p>

            {/* Required Signatories Grid */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                    <th className="py-2.5 px-3">Office / Department</th>
                    <th className="py-2.5 px-3">Authorized Signatory</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Digital Signature / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {signatories.map((sig) => {
                    const signatoryPersonnel = personnel.find(p => p.personnel_id === sig.personnel_id);
                    const sigData = signatures.find(s => s.personnel_id === sig.personnel_id);
                    const isSigned = isFullyCleared || sig.signatory_order > 1; // Show signatories

                    return (
                      <tr key={sig.signatory_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {sig.office_role}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {signatoryPersonnel?.full_name || sig.personnel_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center justify-center">
                            {sigData?.signature_data ? (
                              <img
                                src={sigData.signature_data}
                                alt="Signature"
                                className="h-7 max-w-[130px] object-contain"
                              />
                            ) : (
                              <div className="font-serif italic text-blue-900 text-sm font-bold border-b border-blue-900/40 px-2">
                                {signatoryPersonnel?.full_name.split(' ')[0] || 'Signed'}
                              </div>
                            )}
                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {sigData?.verification_code || `SIA-SIG-2026-000${sig.signatory_order}`}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Clearance Seal and Verification Footer */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-100 border border-slate-300 rounded flex items-center justify-center p-1">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div className="text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800">Digital Certificate ID</div>
                  <div className="font-mono text-blue-900 font-semibold">{certId}</div>
                  <button
                    onClick={handleCopyVerif}
                    className="text-[10px] text-blue-700 underline mt-0.5 cursor-pointer"
                  >
                    {isCopied ? 'Copied to clipboard!' : 'Copy Verification ID'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="w-32 border-b border-slate-900 pb-1 mx-auto text-center font-bold text-xs text-slate-900">
                    FR. RENE G. DELFIN, O.S.A.
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider text-center mt-0.5">
                    School Principal / Director
                  </div>
                </div>

                <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-900 flex flex-col items-center justify-center text-center p-1 bg-blue-50/50">
                  <ShieldCheck className="w-5 h-5 text-blue-900" />
                  <span className="text-[8px] font-extrabold uppercase text-blue-900 tracking-tighter leading-tight mt-0.5">
                    SIA OFFICIAL
                    <br />
                    CLEARPASS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Compliant with SIA Clearance Standard IEEE 1016-2009 SDD specs.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Print Official Clearance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
