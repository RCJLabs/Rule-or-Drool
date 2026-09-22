// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SettingsMenu } from "../../src/ui/SettingsMenu";
import { DEFAULT_SETTINGS } from "../../src/ui/settings";

describe("SettingsMenu", () => {
  afterEach(() => cleanup());

  const open = (over: Partial<Parameters<typeof SettingsMenu>[0]> = {}) => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const onEraseProgress = vi.fn();
    const onHowItWorks = vi.fn();
    render(
      <SettingsMenu
        settings={DEFAULT_SETTINGS}
        onChange={onChange}
        onClose={onClose}
        onEraseProgress={onEraseProgress}
        onHowItWorks={onHowItWorks}
        {...over}
      />,
    );
    return { onChange, onClose, onEraseProgress, onHowItWorks };
  };

  it("reports a toggle without mutating what it was given", () => {
    const settings = { ...DEFAULT_SETTINGS };
    const { onChange } = open({ settings });
    fireEvent.click(screen.getByRole("checkbox", { name: /Reduce motion/ }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, reduceMotion: true });
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("shows the plain screen as one tap, and says which rows it is already doing", () => {
    // Turning it on has to be enough: a menu that claims the text is being mangled while
    // the plain screen is on would be lying to the player it is for (BACKLOG-3 phase 21).
    const { onChange } = open();
    fireEvent.click(screen.getByRole("checkbox", { name: /Plain screen/ }));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, readable: true });

    cleanup();
    open({ settings: { ...DEFAULT_SETTINGS, readable: true } });
    const clean = screen.getByRole("checkbox", { name: /Keep the text clean/ }) as HTMLInputElement;
    expect(clean.checked).toBe(true);
    expect(clean.disabled).toBe(true);
    expect(screen.getByRole("checkbox", { name: /Plain screen/ })).toHaveProperty("disabled", false);
  });

  it("offers leaving the run only when there is one", () => {
    const onExitToMenu = vi.fn();
    open({ onExitToMenu });
    fireEvent.click(screen.getByRole("button", { name: /Leave to the main menu/ }));
    expect(onExitToMenu).toHaveBeenCalled();
    cleanup();
    open();
    expect(screen.queryByRole("button", { name: /Leave to the main menu/ })).toBeNull();
  });

  it("asks twice before erasing everything", () => {
    const { onEraseProgress } = open();
    fireEvent.click(screen.getByRole("button", { name: "Erase all progress" }));
    expect(onEraseProgress).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, erase everything" }));
    expect(onEraseProgress).toHaveBeenCalledTimes(1);
  });
});
