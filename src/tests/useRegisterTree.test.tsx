import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegisterTree } from "../pages/RegistrarDashboard/useRegisterTree";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/config";

// Mock Firebase config
vi.mock("../firebase/config", () => {
  return {
    db: {},
  };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual as any,
    addDoc: vi.fn(),
    collection: vi.fn(),
  };
});

describe("useRegisterTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strictly fails tree creation if custodianId is missing or empty", async () => {
    const mockAddDoc = vi.mocked(addDoc);
    
    mockAddDoc.mockResolvedValue({ id: "new-tree-123" } as any);

    const { result } = renderHook(() => useRegisterTree());

    // Submit with null custodianId
    let submitRes = await act(async () => {
      return await result.current.registerTree({
        species: "Neem",
        ward: "Ward 14",
        custodianId: null as any, // testing the invariant
        registrarOrgId: "org-1",
        viabilityScore: 85,
      });
    });

    expect(submitRes.success).toBe(false);
    expect(submitRes.error).toContain("custodianId is required");
    expect(mockAddDoc).not.toHaveBeenCalled();

    // Submit with empty custodianId
    submitRes = await act(async () => {
      return await result.current.registerTree({
        species: "Neem",
        ward: "Ward 14",
        custodianId: "",
        registrarOrgId: "org-1",
        viabilityScore: 85,
      });
    });

    expect(submitRes.success).toBe(false);
    expect(submitRes.error).toContain("custodianId is required");
    expect(mockAddDoc).not.toHaveBeenCalled();

    // Submit with valid custodianId
    submitRes = await act(async () => {
      return await result.current.registerTree({
        species: "Neem",
        ward: "Ward 14",
        custodianId: "custodian-abc",
        registrarOrgId: "org-1",
        viabilityScore: 85,
      });
    });

    expect(submitRes.success).toBe(true);
    expect(mockAddDoc).toHaveBeenCalledOnce();
  });
});
