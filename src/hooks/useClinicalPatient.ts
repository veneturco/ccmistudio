/**
 * useClinicalPatient.ts
 * 
 * PILAR 3: DESCOMPOSICIÓN DEL MONOLITO - HOOK DE PACIENTE CLÍNICO
 * ===============================================================
 * Maneja de forma aislada y reactiva los datos demográficos del paciente, 
 * autocompletado por cédula, historial local y sincronización.
 */

import { useState, useCallback, useEffect } from 'react';
import { PatientData } from '../types';
import { getPatientByCedula, savePatientRecord, getAllPatients, PatientRecord } from '../utils/patientStorage';

export const INITIAL_PATIENT_DATA: PatientData = {
  fullName: 'Mariana González Rivas',
  idNumber: '14.230.198',
  nationalId: '14.230.198',
  idType: 'V',
  age: '42',
  date: new Date().toLocaleDateString('es-VE'),
  gender: 'F',
  phone: '0412-9841029',
  allergies: 'Negadas',
  address: 'Av. Las Américas, Edif. Centro Médico, Apto 4-B',
};

export function useClinicalPatient(initialPatient?: Partial<PatientData>) {
  const [patient, setPatient] = useState<PatientData>({
    ...INITIAL_PATIENT_DATA,
    ...(initialPatient || {}),
  });

  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Carga inicial de pacientes guardados
  useEffect(() => {
    try {
      const list = getAllPatients();
      setSavedPatients(list);
    } catch {
      // Ignorar en SSR o entornos restringidos
    }
  }, []);

  const updateField = useCallback(<K extends keyof PatientData>(field: K, value: PatientData[K]) => {
    setPatient((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'idNumber' && !prev.nationalId) {
        next.nationalId = value as string;
      } else if (field === 'nationalId' && !prev.idNumber) {
        next.idNumber = value as string;
      }
      return next;
    });
  }, []);

  const setFullPatient = useCallback((data: PatientData) => {
    setPatient({
      ...data,
      nationalId: data.nationalId || data.idNumber,
      idNumber: data.idNumber || data.nationalId || '',
    });
  }, []);

  const resetPatient = useCallback(() => {
    setPatient({
      fullName: '',
      idNumber: '',
      idType: 'V',
      nationalId: '',
      date: new Date().toLocaleDateString('es-VE'),
      age: '',
      gender: 'M',
      phone: '',
      allergies: 'Negadas',
      address: '',
    });
  }, []);

  const searchByNationalId = useCallback((rawId: string) => {
    const cleanId = rawId.replace(/[^\d]/g, '');
    if (!cleanId) return null;

    setIsSearching(true);
    try {
      const found = getPatientByCedula(cleanId);
      if (found) {
        setPatient({
          fullName: found.fullName,
          idNumber: found.nationalId,
          nationalId: found.nationalId,
          idType: found.idType || 'V',
          date: new Date().toLocaleDateString('es-VE'),
          age: found.age ? String(found.age) : '',
          gender: found.gender || 'M',
          phone: found.phone || '',
          allergies: found.allergies || 'Negadas',
          address: found.address || '',
        });
        return found;
      }
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const persistCurrentPatient = useCallback(() => {
    const rawId = patient.nationalId || patient.idNumber;
    if (!patient.fullName || !rawId) return false;
    try {
      const cleanId = rawId.replace(/[^\d]/g, '');
      const existing = getPatientByCedula(cleanId);
      const record: PatientRecord = {
        id: existing?.id || `pat_${Date.now()}`,
        nationalId: rawId,
        cleanId,
        fullName: patient.fullName,
        age: patient.age || '',
        phone: patient.phone || '',
        address: patient.address || '',
        idType: patient.idType,
        gender: patient.gender,
        allergies: patient.allergies,
        lastConsultationDate: new Date().toLocaleDateString('es-VE'),
        lastDiagnosis: existing?.lastDiagnosis || '',
        documentStates: existing?.documentStates || {
          recipe: { rxLeft: '', indicationsRight: '' },
          informe: { motivo: '', antecedentes: '', enfermedadActual: '', examenFisico: '', estudiosParaclinicos: '', diagnostico: '', planConducta: '' },
          ordenLab: { perfilPreoperatorio: [], neuroimagen: [], otrosEstudios: [], diagnosticoPresuntivo: '' },
          constancia: { attendedDate: '', condition: 'Paciente', needsRest: false, restDays: '', restFrom: '', restTo: '', idx: '' },
          historia: { motivoConsulta: '', enfermedadActual: '', antecedentes: '', examenNeurologico: '', diagnostico: '' },
        },
      };
      savePatientRecord(record);
      setSavedPatients(getAllPatients());
      return true;
    } catch {
      return false;
    }
  }, [patient]);

  return {
    patient,
    updateField,
    setFullPatient,
    resetPatient,
    searchByNationalId,
    persistCurrentPatient,
    savedPatients,
    isSearching,
  };
}
