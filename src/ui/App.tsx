import { useMemo } from "react";
import { library } from "../content";
import { Codex } from "./Codex";
import { Ending } from "./Ending";
import { Play } from "./Play";
import { Setup } from "./Setup";
import { useGame } from "./useGame";

export function App() {
  const game = useGame(library);
  const debug = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"), []);
  if (game.screen === "codex") return <Codex lib={library} meta={game.meta} onBack={game.closeCodex} />;
  if (game.screen === "setup" || !game.state) {
    return (
      <Setup
        lib={library}
        saved={game.saved}
        meta={game.meta}
        onStart={game.start}
        onDaily={game.startDaily}
        onContinue={game.continueSaved}
        onCodex={game.openCodex}
      />
    );
  }
  if (game.screen === "over") {
    return <Ending lib={library} state={game.state} fold={game.lastFold} onPlayAgain={game.reset} onCodex={game.openCodex} />;
  }
  return (
    <Play
      lib={library}
      state={game.state}
      transition={game.transition}
      onChoose={game.choose}
      onDismissTransition={game.dismissTransition}
      debug={debug}
      onNudgeDrift={game.nudgeDrift}
    />
  );
}
