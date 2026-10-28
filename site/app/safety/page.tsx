import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety: what disabling does and how to undo it",
  description:
    "What disabling a package on an Android TV means, how to undo it, why firmware updates can turn apps back on, and which packages TVTidy never touches.",
  alternates: { canonical: "/safety/" },
};

// Placeholder until Session 5 writes the full page (docs/gtm-kit.md section 14, "Safety page outline").
export default function SafetyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Safety: what disabling does and how to undo it</h1>

      <h2 className="mt-8 text-xl font-semibold">What disabling means</h2>
      <p className="mt-2 text-neutral-700">
        <code className="rounded bg-neutral-100 px-1">pm disable-user --user 0</code> stops an app from running
        for the TV&apos;s main user. The app stays installed, and nothing is uninstalled.
      </p>

      <h2 className="mt-8 text-xl font-semibold">How to undo it</h2>
      <p className="mt-2 text-neutral-700">
        Run <code className="rounded bg-neutral-100 px-1">adb shell pm enable --user 0 &lt;package&gt;</code> for
        each package. Every model page has a restore block with these commands; save it before you start.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Firmware updates</h2>
      <p className="mt-2 text-neutral-700">
        A firmware update can turn disabled apps back on. Run the same commands again after an update.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What TVTidy never disables</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
        <li>The TV&apos;s stock home screen, which would leave the TV with no home screen.</li>
        <li>Google&apos;s setup wizard (setupwraith), which would delete the saved Wi-Fi network.</li>
        <li>Core Android and TV system packages, without which the TV may not boot.</li>
      </ul>
    </main>
  );
}
