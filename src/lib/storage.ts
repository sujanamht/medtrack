import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadPrescriptionImage(file: File): Promise<string> {
  const timestamp = Date.now()
  const filename = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `prescriptions/${filename}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
