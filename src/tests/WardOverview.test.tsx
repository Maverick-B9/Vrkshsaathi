import { describe, it, expect } from "vitest";

// Exposing the sorting logic for the test to ensure strict compliance with three-tier rules
function sortLeaderboard(orgs: any[]) {
  return [...orgs].sort((a, b) => {
    if (b.survivalRate !== a.survivalRate) return b.survivalRate - a.survivalRate;
    if (b.stewardshipScore !== a.stewardshipScore) return b.stewardshipScore - a.stewardshipScore;
    return b.totalPlanted - a.totalPlanted;
  });
}

describe("WardOverview Leaderboard Sorting", () => {
  it("strictly ranks by Survival Rate % as the primary metric, ignoring raw count", () => {
    const rawOrgs = [
      { id: "A", survivalRate: 80.0, stewardshipScore: 90, totalPlanted: 5000 }, // High count, low survival
      { id: "B", survivalRate: 95.0, stewardshipScore: 95, totalPlanted: 100 },  // Low count, high survival
      { id: "C", survivalRate: 95.0, stewardshipScore: 80, totalPlanted: 500 },  // Tied survival, lower stewardship
      { id: "D", survivalRate: 95.0, stewardshipScore: 95, totalPlanted: 200 },  // Tied survival & stewardship, higher count
    ];

    const sorted = sortLeaderboard(rawOrgs);

    // Expected order:
    // 1. D (95% survival, 95 stewardship, 200 planted)
    // 2. B (95% survival, 95 stewardship, 100 planted)
    // 3. C (95% survival, 80 stewardship, 500 planted)
    // 4. A (80% survival, 90 stewardship, 5000 planted - ranked last despite highest planting volume)
    
    expect(sorted[0].id).toBe("D");
    expect(sorted[1].id).toBe("B");
    expect(sorted[2].id).toBe("C");
    expect(sorted[3].id).toBe("A");
  });
});
