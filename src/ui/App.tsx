import { useEffect, useMemo, useState } from "react";
import { library } from "../content";
import { decodeRunCode, type Decoded } from "../meta";
import { STRINGS } from "../content/strings";
import { Codex } from "./Codex";
import { Ending } from "./Ending";
import { Play } from "./Play";
import { Cabinet } from "./Cabinet";
import { HowItWorks } from "./HowItWorks";
import { MoveProgress } from "./MoveProgress";
import { SettingsMenu } from "./SettingsMenu";
import { Setup } from "./Setup";
import { useGame } from "./useGame";
import { useServiceWorker } from "./useServiceWorker";

/** The progress code in the address's fragment, if a link carried one (BACKLOG-5 phase 33). */
function progressInHash(): string | null {
  const at = window.location.hash.indexOf("progress=");
  return at >= 0 ? window.location.hash.slice(at + "progress=".length) : null;
}

export function App() {
  const game = useGame(library);
  const sw = useServiceWorker();
  const debug = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"), []);
  // A run someone sent (BACKLOG-2 phase 11). Read once; offered, never started unasked.
  const [shared, setShared] = useState<Decoded | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("run");
    return raw ? decodeRunCode(library, raw) : null;
  });
  // Progress brought in a link (BACKLOG-5 phase 33): read, shown against what is here, and
  // put in place only if the player says so. The fragment never reaches a server.
  const [incoming, setIncoming] = useState<string | null>(() => (typeof window === "undefined" ? null : progressInHash()));
  // A link opened in a tab that already has the game only changes the fragment, and the page
  // does not load again, so the change is listened for as well.
  useEffect(() => {
    const onHash = () => {
      const code = progressInHash();
      if (code) setIncoming(code);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const closeMove = () => {
    if (incoming) {
      setIncoming(null);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    game.closeMoveProgress();
  };
  /** The link has done its job once it is answered, so a reload does not offer it again. */
  const answerShared = () => {
    setShared(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("run");
    window.history.replaceState(null, "", url.pathname + (url.search || ""));
  };

  const settingsMenu = game.showSettings ? (
    <SettingsMenu
      settings={game.settings}
      onChange={game.setSettings}
      onClose={game.closeSettings}
      // Only offered mid-run: from the menu there is nothing to leave.
      onExitToMenu={game.screen === "play" ? game.exitToMenu : undefined}
      onEraseProgress={game.eraseProgress}
      onHowItWorks={game.openHowItWorks}
      onMoveProgress={game.openMoveProgress}
      record={game.record}
      onSendRecord={game.sendRecord}
      onDeleteRecord={game.deleteRecord}
    />
  ) : null;

  // Raised over whatever screen asked for it, including the menu: how it works, or moving
  // progress.
  const raised = game.showHow ? (
    <HowItWorks onClose={game.closeHowItWorks} />
  ) : game.showMove || incoming !== null ? (
    <MoveProgress
      key={incoming ?? "menu"}
      lib={library}
      meta={game.meta}
      settings={game.settings}
      incoming={incoming ?? undefined}
      onReplace={game.replaceProgress}
      onClose={closeMove}
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
        {raised}
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
          shared={shared}
          onPlayShared={(code) => {
            answerShared();
            game.startFromCode(code);
          }}
          onDismissShared={answerShared}
          onContinue={game.continueSaved}
          onCodex={game.openCodex}
          onSettings={game.openSettings}
        />
        {settingsMenu}
        {raised}
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
        {raised}
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
        paused={game.showSettings || game.showHow || game.showMove || incoming !== null}
        debug={debug}
        onNudgeDrift={game.nudgeDrift}
        settings={game.settings}
        onSettings={game.openSettings}
        onCabinet={game.openCabinet}
        onTaught={game.markTaught}
      />
      {game.showCabinet && <Cabinet lib={library} state={game.state} onClose={game.closeCabinet} />}
      {settingsMenu}
        {raised}
    </>
  );
}
