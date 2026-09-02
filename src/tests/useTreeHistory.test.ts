import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTreeHistory } from "../pages/TreeLifeRecord/useTreeHistory";

describe("useTreeHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges and sorts events chronologically from the backend", async () => {
    const { result } = renderHook(() => useTreeHistory("tree-123"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const events = result.current.events;
    
    // The mock returns:
    // 1. Planted: 2026-06-01T10:00:00Z
    // 2. Registered: 2026-06-01T11:00:00Z
    // 3. Checkpoint Due: 2027-06-01T10:00:00Z
    
    expect(events.length).toBe(3);
    expect(events[0].type).toBe("PLANTED");
    expect(events[1].type).toBe("REGISTERED");
    expect(events[2].type).toBe("UPCOMING_CHECKPOINT");
    expect(events[2].isFuture).toBe(true);
  });
});
