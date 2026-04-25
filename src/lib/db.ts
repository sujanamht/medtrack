import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getAll<T>(col: string): Promise<(T & { id: string })[]> {
  const snapshot = await getDocs(collection(db, col))
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))
}

export async function getById<T>(col: string, id: string): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(doc(db, col, id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...(snapshot.data() as T) }
}

export async function add<T extends object>(col: string, data: T): Promise<string> {
  const ref = await addDoc(collection(db, col), data)
  return ref.id
}

export async function update<T extends object>(col: string, id: string, data: Partial<T>): Promise<void> {
  await updateDoc(doc(db, col, id), data as Record<string, unknown>)
}

export async function remove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id))
}

export async function getByField<T>(
  col: string,
  field: string,
  value: unknown
): Promise<(T & { id: string })[]> {
  const q = query(collection(db, col), where(field, '==', value))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))
}

export const COLLECTIONS = {
  prescriptions: 'prescriptions',
  medications: 'medications',
  medicationLogs: 'medication_logs',
  notifications: 'notifications',
  dietRecommendations: 'diet_recommendations',
} as const
