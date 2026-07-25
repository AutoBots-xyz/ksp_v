import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ksp-slate p-6 text-center">
      <h1 className="text-6xl font-bold text-ksp-danger">403</h1>
      <p className="mt-4 text-lg text-ksp-navy">You do not have access to this section.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-ksp-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-ksp-blue"
      >
        Return home
      </Link>
    </main>
  );
}
