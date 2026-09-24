import { Component, Fragment, type ReactNode } from "react";
import { STRINGS } from "../content/strings";
import { APP_VERSION } from "../version";
import { appendRecorded, loadOpen, saveOpen } from "./playtest";
import { clearRun, loadRun } from "./save";

interface State {
  error: Error | null;
  /** Bumped to draw the game again from what is saved, as a fresh load would. */
  mount: number;
}

/**
 * Around the whole game (BACKLOG-8 phase 50). A screen that throws, or a game action that
 * throws (see `guarded` in useGame.ts), used to leave a blank page, or a button that did
 * nothing every time it was pressed. Now it leaves a sentence and a way back to the menu. When
 * a run is in progress it can be left, since a saved run that breaks the screen breaks it again
 * each time it is continued.
 */
export class CrashGuard extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null, mount: 0 };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  /** The game again, from storage, at the menu. A link that brought the player here is dropped, in case it is what broke. */
  private backToMenu = () => {
    window.history.replaceState(null, "", window.location.pathname);
    this.setState((s) => ({ error: null, mount: s.mount + 1 }));
  };

  /** The saved run goes, and any record of it keeps the cards played so far, marked as left. */
  private leaveRun = () => {
    const open = loadOpen();
    saveOpen(null);
    if (open && open.cards.length > 0) appendRecorded(open);
    clearRun();
    this.backToMenu();
  };

  override render() {
    const { error, mount } = this.state;
    if (!error) return <Fragment key={mount}>{this.props.children}</Fragment>;
    const c = STRINGS.crash;
    const run = loadRun();
    const inRun = !!run && !run.over;
    return (
      <main className="crash">
        <div className="crash-card" role="alert">
          <h1>{c.title}</h1>
          <p>{c.body}</p>
          <div className="settings-actions">
            <button type="button" className="primary" onClick={this.backToMenu} autoFocus>
              {c.menu}
            </button>
            {inRun && (
              <button type="button" onClick={this.leaveRun}>
                {c.leave}
              </button>
            )}
          </div>
          {inRun && <p className="crash-note">{c.leaveNote}</p>}
          <p className="crash-detail">{c.detail.replace("{version}", APP_VERSION).replace("{error}", error.message || error.name)}</p>
        </div>
      </main>
    );
  }
}
