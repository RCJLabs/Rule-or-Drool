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
