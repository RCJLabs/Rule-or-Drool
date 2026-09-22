import { STRINGS } from "../content/strings";
import { makeRng } from "../engine/rng";
import { holoLevel, sponsorFor, streamLevel, viewersFor, type Theme } from "./theme";

/**
 * What the two paths put on screen around the card (BACKLOG-3 phase 18).
 *
 * Decay is a livestream and Ascent is a projection, and both arrive in three stages rather
 * than all at once: the first is a frame, the second adds the room talking, the third is
 * the whole thing. Everything here is decoration — `aria-hidden`, `pointer-events: none`,
 * and never over the two choices — because a run has to stay playable at the bottom of it.
 *
 * Every string is picked from a seeded RNG keyed on (seed, card count), so the chat does not
 * reshuffle when React re-renders the same card.
 */

function picks<T>(xs: readonly T[], n: number, seed: number, salt: number): T[] {
  const rng = makeRng((Math.imul(seed, 2246822519) + Math.imul(salt, 3266489917)) | 0);
  const pool = [...xs];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  return out;
}

interface Props {
  theme: Theme;
  seed: number;
  /** Card count, so the chat moves on with the run. */
  n: number;
}

function StreamChrome({ theme, seed, n }: Props) {
  const level = streamLevel(theme);
  if (level === 0) return null;
  const { names, alerts, live, watching, subGoal } = STRINGS.stream;
  const alert = level >= 2 ? picks(alerts, 1, seed, n * 13)[0]!.replace("{who}", sponsorFor(seed, n)) : null;
  const second = level >= 3 ? `★ ${picks(names, 1, seed, n * 17)[0]} is now a TIER 3 subscriber` : null;
  // The goal never quite gets there, which is the point of a goal.
  const goal = 80 + Math.floor(makeRng(Math.imul(seed ^ n, 2654435761))() * 19);

  return (
    <div className="stream" aria-hidden="true">
      <span className="stream-live">{live}</span>
      <span className="stream-views">
        {viewersFor(seed, n, level).toLocaleString()} {watching}
      </span>
      {level >= 3 && (
        <span className="stream-goal">
          {subGoal} {goal}/100
        </span>
      )}
      {second && <p className="stream-alert second">{second}</p>}
      {alert && <p className="stream-alert">◈ {alert}</p>}
    </div>
  );
}

function HoloChrome({ theme }: Props) {
  const level = holoLevel(theme);
  if (level === 0) return null;
  return (
    <div className="holo" aria-hidden="true">
      {/* Two dimmer planes behind the card from the second stage, so the projection has
          somewhere to be rather than sitting on the glass. */}
      {level >= 2 && <span className="holo-pane far" />}
      {level >= 3 && <span className="holo-pane near" />}
      <span className="holo-plinth" />
    </div>
  );
}

export function PathChrome(props: Props) {
  return props.theme.stage < 0 ? <StreamChrome {...props} /> : <HoloChrome {...props} />;
}

/**
 * The chat and the emote spam live inside the stage rather than over the whole frame, so
 * they are positioned against the space the card sits in and cannot reach the meters above
 * or the footer below. The stage gives them a gutter; they never overlap the card, because
 * the first version overlaid the prose and made the game unreadable.
 */
export function StreamGutters({ theme, seed, n }: Props) {
  const level = streamLevel(theme);
  if (level < 2) return null;
  const { chat, names, emotes } = STRINGS.stream;
  const lines = picks(chat, level >= 3 ? 6 : 4, seed, n);
  const who = picks(names, lines.length, seed, n * 7 + 1);
  const spam = level >= 3 ? picks(emotes, 6, seed, n * 19) : [];
  return (
    <>
      {spam.length > 0 && (
        <p className="stream-emotes" aria-hidden="true">
          {spam.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </p>
      )}
      <div className="stream-chat" aria-hidden="true">
        {lines.map((line, i) => (
          <p key={i}>
            <b>{who[i] ?? "chat"}</b> {line}
          </p>
        ))}
      </div>
    </>
  );
}
