import { useMemo } from "react";
import { library } from "../content";
import { STRINGS } from "../content/strings";
import { Codex } from "./Codex";
import { Ending } from "./Ending";
import { Play } from "./Play";
import { SettingsMenu } from "./SettingsMenu";
import { Setup } from "./Setup";
import { useGame } from "./useGame";
import { useServiceWorker } from "./useServiceWorker";

export function App() {
  const game = useGame(library);
  const sw = useServiceWorker();
  const debug = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"), []);

  const settingsMenu = game.showSettings ? (
    <SettingsMenu
      settings={game.settings}
      onChange={game.setSettings}
      onClose={game.closeSettings}
      // Only offered mid-run: from the menu there is nothing to leave.
      onExitToMenu={game.screen === "play" ? game.exitToMenu : undefined}
      onEraseProgress={game.eraseProgress}
    />
  ) : null;

  const banner = sw.updateReady ? (
    <div className="update-banner" role="status">
      {STRINGS.ui.updateReady}
      <button type="button" onClick={sw.applyUpdate}>
        {STRINGS.ui.reload}
      </button>
    </div>
  ) : null;
  if (game.screen === "codex") {
    return (
      <>
        {banner}
        <Codex lib={library} meta={game.meta} onBack={game.closeCodex} onSettings={game.openSettings} />
        {settingsMenu}
      </>
    );
  }
  if (game.screen === "setup" || !game.state) {
    return (
      <>
        {banner}
        <Setup
          lib={library}
          saved={game.saved}
          meta={game.meta}
          onStart={game.start}
          onDaily={game.startDaily}
          onContinue={game.continueSaved}
          onCodex={game.openCodex}
          onSettings={game.openSettings}
        />
        {settingsMenu}
      </>
    );
  }
  if (game.screen === "over") {
    return (
      <>
        {banner}
        <Ending
          lib={library}
          state={game.state}
          fold={game.lastFold}
          onPlayAgain={game.reset}
          onCodex={game.openCodex}
          onSettings={game.openSettings}
        />
        {settingsMenu}
      </>
    );
  }
  return (
    <>
      {banner}
        <Play
        lib={library}
        state={game.state}
        transition={game.transition}
        onChoose={game.choose}
        onDismissTransition={game.dismissTransition}
        debug={debug}
        onNudgeDrift={game.nudgeDrift}
        settings={game.settings}
        onSettings={game.openSettings}
      />
      {settingsMenu}
    </>
  );
}
