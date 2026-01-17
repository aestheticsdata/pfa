"use client";

import Layout from "@src/components/shared/Layout";

export default function About() {
  return (
    <Layout isLogin>
      <div className="flex flex-col items-center w-96 space-y-8 mt-28 rounded-sm bg-linear-to-br from-teal-300 to-sky-500 py-3 font-smooch shadow-lg">
        <div>Site hébergé chez OVH SAS</div>
        <div>Siège social : 2 rue Kellermann - 59100 Roubaix - France</div>
        <div>Code APE 2620Z</div>
        <div>N° TVA : FR 22 424 761 419</div>
      </div>
    </Layout>
  );
}

