import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CountdownTimer } from "../components/ui/index";

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates time remaining strictly from the provided deadline prop (true-source)", () => {
    // Current time: 2026-08-30T10:00:00Z
    const now = new Date("2026-08-30T10:00:00Z").getTime();
    vi.setSystemTime(now);

    // Deadline: 2026-08-30T11:00:00Z (exactly 1 hour from now)
    const deadlineStr = "2026-08-30T11:00:00Z";

    render(<CountdownTimer deadline={deadlineStr} />);

    // It should immediately calculate 1h 0m based on the injected deadline
    expect(screen.getByText(/1h 0m/i)).toBeInTheDocument();

    // Advance 30 minutes
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    // Should now read 30m
    expect(screen.getByText(/0h 30m/i)).toBeInTheDocument();
  });

  it("displays EXPIRED if the current time surpasses the deadline prop", () => {
    const now = new Date("2026-08-30T10:00:00Z").getTime();
    vi.setSystemTime(now);

    // Deadline was 1 hour ago
    const deadlineStr = "2026-08-30T09:00:00Z";

    render(<CountdownTimer deadline={deadlineStr} />);
    expect(screen.getByText(/EXPIRED/i)).toBeInTheDocument();
  });
});
