// ADB command lines shown on model pages. Disable only, never uninstall (CLAUDE.md).
export const disableCommand = (pkg: string) => `adb shell pm disable-user --user 0 ${pkg}`;
export const restoreCommand = (pkg: string) => `adb shell pm enable --user 0 ${pkg}`;
