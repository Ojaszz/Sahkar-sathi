// Entry redirect — auth gate in root layout handles the actual routing
import { Redirect } from 'expo-router';

export default function Index() {
  // Root layout's <Gate> component decides where to send the user.
  // This keeps the splash visible while session restores.
  return <Redirect href="/auth/login" />;
}