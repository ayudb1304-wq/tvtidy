// Model page copy: docs/gtm-kit.md section 9 (title pattern, skeleton) and section 14 (copy skeleton).
import type { ExcludedReason, Model, RatedPackage } from "./data";
import { shortName } from "./data";

export function modelTitle(model: Model): string {
  return `${shortName(model)} debloat list: remove ads and bloat (reversible)`;
}

export function counts(packages: RatedPackage[]) {
  return {
    yes: packages.filter((p) => p.safe === "yes").length,
    caution: packages.filter((p) => p.safe === "caution").length,
    no: packages.filter((p) => p.safe === "no").length,
  };
}

export function oneLineAnswer(model: Model, packages: RatedPackage[]): string {
  const { yes, caution } = counts(packages);
  const tv = `${shortName(model)} (${model.brand_display}, ${model.os_raw})`;
  const pkgs = (n: number) => `${n} ${n === 1 ? "package" : "packages"}`;
  if (yes === 0) {
    return `${pkgs(caution)} on the ${tv} are on the community debloat list. None is verified as safe yet, so each one is optional: read its row before you include it.`;
  }
  return `${pkgs(yes)} on the ${tv} can be disabled safely; ${caution} more ${caution === 1 ? "is" : "are"} optional.`;
}

export const EXCLUDED_REASON_TEXT: Record<ExcludedReason, string> = {
  stock_launcher:
    "The TV's stock home screen. The community list replaces it with its own launcher; without one, disabling it leaves the TV with no home screen.",
  setupwraith_wifi:
    "Google's setup wizard. Disabling it deletes the Wi-Fi network saved during setup, which drops the TV off Wi-Fi.",
  core_android: "A core Android or TV system package. The TV may stop booting without it.",
};

export function faq(model: Model): { question: string; answer: string }[] {
  const name = shortName(model);
  return [
    {
      question: `Will this survive a firmware update on the ${name}?`,
      answer:
        "Usually, but not always. A firmware update can turn disabled apps back on. Run the same commands again after an update; nothing else needs to change.",
    },
    {
      question: "Can I undo it?",
      answer:
        "Yes. Disabling keeps every app installed, and the restore block on this page turns each one back on with pm enable. Nothing is uninstalled.",
    },
    {
      question: "Do I need root?",
      answer:
        "No. This uses Developer options and ADB, which the TV offers to its owner. It does not root the TV, flash firmware, or bypass any lock or DRM.",
    },
  ];
}

export function howToSteps(): { name: string; text: string }[] {
  return [
    {
      name: "Turn on developer access",
      text: "On the TV, open Settings, find the build number under About and select it seven times to unlock Developer options, then turn on network or wireless debugging.",
    },
    {
      name: "Connect with ADB",
      text: "On a computer with Android platform-tools installed, run adb connect followed by the TV's IP address and accept the prompt on the TV.",
    },
    {
      name: "Save the restore commands",
      text: "Copy the restore block from this page and keep it, so you can turn every package back on.",
    },
    {
      name: "Disable the packages",
      text: "Paste the disable commands into the terminal. Each one disables a package for the main user without uninstalling it.",
    },
    { name: "Restart the TV", text: "Restart the TV and check that your apps, inputs and remote still work." },
  ];
}
