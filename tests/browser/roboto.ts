import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The font the audits measure in (BACKLOG-5 phase 32). The game asks for the system font,
 * which on Android is Roboto; on this machine and on CI's it is DejaVu Sans, a fifth wider,
 * so a fit audit read in it failed names that fit on every Android phone. Roboto is in
 * `fonts/` (the weights the game uses, 400 to 800, under the SIL Open Font License in
 * `fonts/OFL.txt`), and Chromium is pointed at it with a fontconfig that puts it first for
 * the system and sans-serif families.
 *
 * Only Chromium on Linux reads fontconfig, which is what CI runs. Elsewhere the audits see
 * the system's own font, and a fit that passes or fails there is that font's, not Android's.
 */
export const ROBOTO_DIR = fileURLToPath(new URL("./fonts/", import.meta.url));

/** Write the fontconfig file and return its path, for `FONTCONFIG_FILE`. */
export function robotoFontconfig(): string {
  const dir = join(tmpdir(), "rod-roboto");
  mkdirSync(dir, { recursive: true });
  const conf = join(dir, "fonts.conf");
  writeFileSync(
    conf,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
  <dir>${ROBOTO_DIR}</dir>
  <alias binding="strong"><family>system-ui</family><prefer><family>Roboto</family></prefer></alias>
  <alias binding="strong"><family>sans-serif</family><prefer><family>Roboto</family></prefer></alias>
</fontconfig>
`,
  );
  return conf;
}

/** The environment a browser needs to draw in Roboto. */
export function robotoEnv(): Record<string, string> {
  return { ...(process.env as Record<string, string>), FONTCONFIG_FILE: robotoFontconfig() };
}
