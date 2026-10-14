import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SEED_SURVEILLANCE_REPORTS } from './pincodeData';

export interface SymptomReportItem {
  id?: string;
  pincode: string;
  symptom: string;
  category?: string;
  severity?: "low" | "moderate" | "high" | "critical";
  lat?: number;
  lng?: number;
  regionName?: string;
  confidenceScore?: number;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase App and Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validates connection to Firestore on initial boot as required by Firebase integration skill.
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'symptom_reports', 'connection-health-check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or offline state.");
    }
    return false;
  }
}

/**
 * Persists a new symptom report to Firestore
 */
export async function saveSymptomReportToFirestore(report: SymptomReportItem): Promise<string> {
  const collectionPath = 'symptom_reports';
  try {
    const docRef = await addDoc(collection(db, collectionPath), {
      pincode: report.pincode,
      symptom: report.symptom,
      category: report.category || 'General',
      severity: report.severity || 'moderate',
      lat: report.lat ?? 20.5937,
      lng: report.lng ?? 78.9629,
      regionName: report.regionName || `PIN ${report.pincode}`,
      confidenceScore: report.confidenceScore ?? 0.95,
      createdAt: report.createdAt || new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    throw error;
  }
}

/**
 * Subscribes to real-time updates of recent symptom reports for the Admin Dashboard
 */
export function subscribeToSurveillanceReports(
  onUpdate: (reports: SymptomReportItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = 'symptom_reports';
  try {
    const q = query(
      collection(db, collectionPath),
      orderBy('createdAt', 'desc'),
      limit(60)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreReports: SymptomReportItem[] = [];
        snapshot.forEach((docSnapshot) => {
          firestoreReports.push({
            id: docSnapshot.id,
            ...(docSnapshot.data() as Omit<SymptomReportItem, 'id'>)
          });
        });

        // Merge with initial seed data if firestore has only a few records
        if (firestoreReports.length === 0) {
          onUpdate(SEED_SURVEILLANCE_REPORTS);
        } else {
          // Put new live firestore reports at top, followed by seed reports that don't collide
          const existingIds = new Set(firestoreReports.map(r => r.id));
          const combined = [
            ...firestoreReports,
            ...SEED_SURVEILLANCE_REPORTS.filter(s => !existingIds.has(s.id))
          ];
          onUpdate(combined);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
        if (onError) onError(error);
        // Fallback to seed data on permission/offline
        onUpdate(SEED_SURVEILLANCE_REPORTS);
      }
    );

    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
    onUpdate(SEED_SURVEILLANCE_REPORTS);
    return () => {};
  }
}
