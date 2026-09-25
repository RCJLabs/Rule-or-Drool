import { useEffect, useMemo, useState } from "react";
import { library } from "../content";
import { DECK_PATTERN } from "../engine/deck";
import { decodeRunCode, decodeRunResult, type Decoded, type RunResult } from "../meta";
import { STRINGS } from "../content/strings";
import { Codex, type CodexSection } from "./Codex";
import { Ending } from "./Ending";
import { Play } from "./Play";
import { Cabinet } from "./Cabinet";
import { HowItWorks } from "./HowItWorks";
import { MoveProgress } from "./MoveProgress";
import { NoticeDialog } from "./Notice";
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
  // The codex section left open, so going back to the menu and returning finds it open.
  const [codexOpen, setCodexOpen] = useState<CodexSection | null>(null);
  const debug = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"), []);
  // A run someone sent (BACKLOG-2 phase 11). Read once; offered, never started unasked.
  const [shared, setShared] = useState<Decoded | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("run");
    return raw ? decodeRunCode(library, raw) : null;
  });
  // The deck their run was dealt from, when the link says (BACKLOG-8 phase 49): the offer tells
  // the player whether this version deals the same run, and the end whether to compare.
  const [sharedDeck, setSharedDeck] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("deck");
    return raw && DECK_PATTERN.test(raw) ? raw : null;
  });
  // How it went for them, when the link says (BACKLOG-5 phase 37): beside the run code, not in
  // it, so a version of the game from before this still opens the link.
  const [sharedResult, setSharedResult] = useState<RunResult | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = new URLSearchParams(window.location.search).get("vs");
    const result = raw ? decodeRunResult(library, raw) : null;
    return result && sharedDeck ? { ...result, deck: sharedDeck } : result;
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
    setSharedResult(null);
    setSharedDeck(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("run");
    url.searchParams.delete("vs");
    url.searchParams.delete("deck");
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
      asides={game.asides}
      onReplace={game.replaceProgress}
      onClose={closeMove}
    />
  ) : null;

  // Over everything else, Move my progress included: a failed save, or a profile set aside
  // (BACKLOG-8 phase 50).
  const notice = game.notice ? (
    <NoticeDialog
      notice={game.notice}
      onMoveProgress={() => {
        game.dismissNotice();
        game.openMoveProgress();
      }}
      onDismiss={game.dismissNotice}
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
        <Codex lib={library} meta={game.meta} onBack={game.closeCodex} onSettings={game.openSettings} open={codexOpen} onOpen={setCodexOpen} />
        {settingsMenu}
        {raised}
        {notice}
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
          savedDaily={game.savedDaily}
          meta={game.meta}
          onStart={game.start}
          onDaily={game.startDaily}
          shared={shared}
          sharedResult={sharedResult}
          sharedDeck={sharedDeck}
          onPlayShared={(code) => {
            answerShared();
            game.playShared(code, sharedResult);
          }}
          onDismissShared={answerShared}
          onContinue={game.continueSaved}
          onCodex={game.openCodex}
          onContracts={() => {
            setCodexOpen("contracts");
            game.openCodex();
          }}
          onSettings={game.openSettings}
        />
        {settingsMenu}
        {raised}
        {notice}
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
          challenge={game.challenge}
          onPlayAgain={game.reset}
          onTakeOtherRoad={game.takeOtherRoad}
          onCodex={game.openCodex}
          onSettings={game.openSettings}
        />
        {settingsMenu}
        {raised}
        {notice}
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
        paused={game.showSettings || game.showHow || game.showMove || incoming !== null || game.notice !== null}
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
      {notice}
    </>
  );
}
