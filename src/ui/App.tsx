import { useMemo } from "react";
import { library } from "../content";
import { Ending } from "./Ending";
import { Play } from "./Play";
import { Setup } from "./Setup";
import { useGame } from "./useGame";

export function App() {
  const game = useGame(library);
  const debug = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"), []);
  if (game.screen === "setup" || !game.state) {
    return <Setup lib={library} saved={game.saved} onStart={game.start} onContinue={game.continueSaved} />;
  }
  if (game.screen === "over") return <Ending lib={library} state={game.state} onPlayAgain={game.reset} />;
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
