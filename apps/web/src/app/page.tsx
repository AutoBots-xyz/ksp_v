import { redirect } from 'next/navigation';

// Role redirect entry. Full guard pipeline lands in 2A:
// ensureSession -> load /me -> canAccessRoute -> render | redirect.
export default function Home() {
  // 2A: resolve session + /me, then redirect to defaultHome(role).
  // For 0B scaffold: send to login (auth not wired until 0C).
  redirect('/login');
}
