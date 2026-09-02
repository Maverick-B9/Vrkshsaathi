import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitIncident } from "../pages/CitizenTreePage/useSubmitIncident";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase/config";

// Mock Firebase config
vi.mock("../firebase/config", () => {
  return {
    db: {},
    storage: {},
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

vi.mock("firebase/storage", async () => {
  const actual = await vi.importActual("firebase/storage");
  return {
    ...actual as any,
    ref: vi.fn(),
    uploadBytes: vi.fn(),
  };
});

// Mock IDB queue (we mock the module for the hook, but for testing offlineQueue itself we need to mock idb)
vi.mock("idb", () => ({
  openDB: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        payload: {
          treeId: "TEST-2",
          category: "DISEASED",
          photoBlob: new Blob(["photo"], { type: "image/jpeg" }),
          audioBlob: new Blob(["audio"], { type: "audio/webm" }),
          status: "PENDING",
          reportedAt: new Date().toISOString(),
        }
      }
    ]),
    delete: vi.fn(),
  }),
}));

// We need to import syncOfflineIncidents after mocking idb
import { syncOfflineIncidents } from "../lib/offlineQueue";

vi.mock("../lib/offlineQueue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/offlineQueue")>();
  return {
    ...actual,
    queueIncidentForSync: vi.fn(),
  };
});

// Mock Image Compressor
vi.mock("../lib/imageCompressor", () => ({
  compressPhoto: vi.fn(async (blob) => blob), // Just return the blob
}));

describe("useSubmitIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strictly calls addDoc before uploadBytes when submitting online", async () => {
    // 1. Setup mocks
    const mockAddDoc = vi.mocked(addDoc);
    const mockUploadBytes = vi.mocked(uploadBytes);
    
    // Track execution order
    const executionOrder: string[] = [];
    
    mockAddDoc.mockImplementation(async () => {
      executionOrder.push("addDoc");
      return { id: "mock-incident-123" } as any;
    });
    
    mockUploadBytes.mockImplementation(async () => {
      executionOrder.push("uploadBytes");
      return {} as any;
    });

    // 2. Render hook
    const { result } = renderHook(() => useSubmitIncident());

    // 3. Fake online state
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    // 4. Create fake photo and audio blobs
    const mockBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    const mockFile = new File([mockBlob], "photo.jpg", { type: "image/jpeg" });
    const mockAudioBlob = new Blob(["fake-audio-data"], { type: "audio/webm" });

    // 5. Submit
    await act(async () => {
      await result.current.submitIncident({
        treeId: "TEST-1",
        category: "WATER_NEEDED",
        notes: "Looks dry",
        photoBlob: mockFile,
        audioBlob: mockAudioBlob,
      });
    });

    // 6. Assertions
    expect(mockAddDoc).toHaveBeenCalledOnce();
    expect(mockUploadBytes).toHaveBeenCalledTimes(2);
    
    // The CRITICAL assertion: addDoc must finish before uploadBytes begins
    expect(executionOrder).toEqual(["addDoc", "uploadBytes", "uploadBytes"]); // uploadBytes x2 (photo, audio)
  });

  it("strictly calls addDoc before uploadBytes during offline sync (replay path)", async () => {
    const mockAddDoc = vi.mocked(addDoc);
    const mockUploadBytes = vi.mocked(uploadBytes);
    const executionOrder: string[] = [];
    
    mockAddDoc.mockImplementation(async () => {
      executionOrder.push("addDoc");
      return { id: "mock-sync-123" } as any;
    });
    
    mockUploadBytes.mockImplementation(async () => {
      executionOrder.push("uploadBytes");
      return {} as any;
    });

    await syncOfflineIncidents();

    expect(mockAddDoc).toHaveBeenCalledOnce();
    expect(mockUploadBytes).toHaveBeenCalledTimes(2); // Both photo and audio are in the mock IDB payload
    
    // addDoc must strictly precede any uploadBytes
    expect(executionOrder).toEqual(["addDoc", "uploadBytes", "uploadBytes"]);
  });
});
