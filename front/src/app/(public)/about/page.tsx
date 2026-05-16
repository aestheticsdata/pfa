"use client";

export default function About() {
  return (
    <div className="auth-card-gradient w-full max-w-md p-8 rounded-xl border border-gray-700/40 shadow-2xl flex flex-col gap-4 text-gray-200">
      <h2 className="text-xl font-medium text-gray-100">À propos</h2>
      <ul className="space-y-2 text-sm text-gray-400">
        <li>Site hébergé chez OVH SAS</li>
        <li>Siège social : 2 rue Kellermann — 59100 Roubaix — France</li>
        <li>Code APE 2620Z</li>
        <li>N° TVA : FR 22 424 761 419</li>
      </ul>
    </div>
  );
}
