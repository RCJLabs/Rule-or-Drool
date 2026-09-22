import { STRINGS } from "../content/strings";
import type { Library } from "../engine/library";
import type { GameState } from "../engine/types";
import { Portrait } from "./Portrait";
import { rivalReport } from "./rival";

interface Props {
  lib: Library;
  state: GameState;
  onClose: () => void;
}

/** Where you left it when they asked you for something (BACKLOG-2 phase 15). */
function standing(state: GameState, role: string): string | null {
  if (state.flags.includes(`owed_${role}`)) return STRINGS.cabinet.owed;
  if (state.flags.includes(`snubbed_${role}`)) return STRINGS.cabinet.snubbed;
  return null;
}

/** "14 cards in post", or the two cases where a number would read oddly. */
function tenure(state: GameState, role: string): string {
  const since = state.cabinetSince[role];
  if (since === undefined || since === 0) return STRINGS.cabinet.sinceStart;
  const served = state.cardCount - since;
  if (served <= 0) return STRINGS.cabinet.newToday;
  return `${served} ${STRINGS.cabinet.tenure}`;
}

/**
 * Who is in the room, and what each of them does to the numbers on their own cards
 * (BACKLOG-2 phase 12). Advisor traits scale every effect a role's cards carry, and until
 * this screen the player was never shown that the mechanic existed.
 */
export function Cabinet({ lib, state, onClose }: Props) {
  const rivalRole = lib.config.rivalRole;
  const roles = lib.roles.filter((r) => r !== rivalRole);
  const rivalId = state.cabinet[rivalRole];
  const rival = rivalId ? lib.advisorsById.get(rivalId) : undefined;
  // Item 10 records who was let go; here it says who they were replacing.
  const report = rivalReport(lib, state);
  const letGo = state.stats.firedAdvisors
    .map((id) => lib.advisorsById.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cabinet-title">
      <div className="overlay-card cabinet">
        <h2 id="cabinet-title">{STRINGS.cabinet.title}</h2>

        <ul className="cabinet-list">
          {roles.map((role) => {
            const advisor = lib.advisorsById.get(state.cabinet[role] ?? "");
            if (!advisor) return null;
            const traits = advisor.traits.map((t) => STRINGS.traits[t]).filter(Boolean);
            return (
              <li key={role}>
                <Portrait role={role} advisorId={advisor.id} seed={state.seed} size={44} />
                <div className="cabinet-who">
                  <b>{advisor.name}</b>
                  <span>
                    {STRINGS.roles[role] ?? role} · {tenure(state, role)}
                  </span>
                  {standing(state, role) && <em className="cabinet-standing">{standing(state, role)}</em>}
                  {traits.length === 0 ? (
                    <em>{STRINGS.cabinet.noTrait}</em>
                  ) : (
                    traits.map((t) => (
                      <em key={t!.name}>
                        <b>{t!.name}.</b> {t!.blurb}
                      </em>
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {rival && (
          /* The one person in the list who is not yours, and the only place the run says how
             they are doing. The standing was computed every card and shown nowhere until
             now (BACKLOG-3 phase 24). */
          <p className={`cabinet-note rival rung-${report.rung}`} data-rung={report.rung}>
            <span className="rival-who">
              <b>{rival.name}</b> · {STRINGS.roles[rivalRole] ?? rivalRole} — {STRINGS.cabinet.rival}
            </span>
            <span className="rival-state">{report.state}</span>
            <span className="rival-cost">{report.cost}</span>
          </p>
        )}
        {letGo.length > 0 && (
          <p className="cabinet-note">
            {STRINGS.cabinet.letGo} {letGo.map((a) => a.name).join(", ")}.
          </p>
        )}

        <button type="button" className="primary" onClick={onClose} autoFocus>
          {STRINGS.ui.close}
        </button>
      </div>
    </div>
  );
}
