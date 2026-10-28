"use client";

import { useState } from "react";
import { disableCommand, restoreCommand } from "@/lib/commands";

function CodeBlock({ id, label, lines, empty }: { id: string; label: string; lines: string[]; empty: string }) {
  const [copied, setCopied] = useState(false);
  const text = lines.join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <button
          type="button"
          onClick={copy}
          disabled={lines.length === 0}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        id={id}
        className={`mt-2 overflow-x-auto rounded-md bg-neutral-900 p-3 text-sm leading-relaxed text-neutral-100 ${
          lines.length ? "" : "whitespace-pre-wrap"
        }`}
      >
        <code>{lines.length ? text : `# ${empty}`}</code>
      </pre>
    </div>
  );
}

export function CommandBlocks({ yes, caution }: { yes: string[]; caution: string[] }) {
  const [includeCaution, setIncludeCaution] = useState(false);
  const selected = includeCaution ? [...yes, ...caution] : yes;
  const empty =
    yes.length === 0
      ? "No package on this list is verified as safe yet. Include caution packages to see the commands."
      : "Nothing selected.";

  return (
    <div>
      <h2 className="mt-8 text-xl font-semibold">Commands (copy, then paste into adb)</h2>
      <p className="mt-2 text-neutral-700">
        Turn on Developer options and network (or wireless) debugging on the TV, then connect with{" "}
        <code className="rounded bg-neutral-100 px-1">adb connect &lt;tv-ip&gt;</code>.
      </p>
      {caution.length > 0 && (
        <label className="mt-3 flex items-start gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={includeCaution}
            onChange={(e) => setIncludeCaution(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Include the {caution.length} caution {caution.length === 1 ? "package" : "packages"}. Read each row in
            the table first: some of them are apps you may use.
          </span>
        </label>
      )}
      <CodeBlock id="disable-commands" label="Disable" lines={selected.map(disableCommand)} empty={empty} />

      <h2 className="mt-8 text-xl font-semibold">Undo everything</h2>
      <p className="mt-2 text-neutral-700">
        These re-enable every package the block above disables. Leave out any package that was already disabled
        before you started.
      </p>
      <CodeBlock id="restore-commands" label="Restore" lines={selected.map(restoreCommand)} empty={empty} />
    </div>
  );
}
