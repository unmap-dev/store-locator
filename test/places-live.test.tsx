// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";

// A key is configured; the SDK is a fake so the test sees exactly what the app asks for. The map
// and the search box need a browser MapLibre cannot get in jsdom, so they are stubbed.
vi.mock("@/lib/kit/config", async (orig) => ({ ...(await orig<typeof import("@/lib/kit/config")>()), API_KEY: "um_test_x" }));
const matrix = vi.fn();
vi.mock("@/lib/kit/client", () => ({ getUnmap: () => ({ router: { matrix, route: vi.fn(), isochrone: vi.fn() } }) }));
vi.mock("@/components/places/stores-map", () => ({ StoresMap: () => <div data-testid="map" /> }));


import { PlacesApp } from "../components/places/places-app";

beforeEach(() => {
  matrix.mockReset();
  window.history.replaceState(null, "", "/?from=-114.0869,51.0526&label=Kensington");
});
afterEach(() => cleanup());

const rowIds = () => within(screen.getByRole("list", { name: "Branches" })).getAllByRole("button").map((b) => b.getAttribute("data-store-row"));

describe("Places with travel times", () => {
  it("asks the Matrix API for at most 10 branches a call and orders by its times", async () => {
    // Every branch 20 min, except Crowfoot at 5 min: travel time must beat straight line.
    matrix.mockImplementation(async (_o: unknown, dests: [number, number][]) => ({
      durations: [dests.map((d) => (d[0] === -114.2061 ? 300 : 1200))],
      distances: [dests.map(() => 5000)],
    }));
    render(<PlacesApp />);
    await waitFor(() => expect(rowIds()[0]).toBe("crowfoot"));
    expect(matrix).toHaveBeenCalledTimes(2);
    for (const call of matrix.mock.calls) expect((call[1] as unknown[]).length).toBeLessThanOrEqual(10);
    expect(screen.getAllByText(/in a straight line/).length).toBe(20);
    expect(screen.getByText("Closest")).toBeTruthy();
  });

  it("says when a branch has no travel time, without calling it unreachable", async () => {
    matrix.mockImplementation(async (_o: unknown, dests: unknown[]) => ({ durations: [dests.map((_, i) => (i === 0 ? null : 600))], distances: [dests.map(() => 1)] }));
    render(<PlacesApp />);
    await screen.findByText(/That is not proof there is no road/);
    expect(screen.getAllByText("No travel time").length).toBe(2);
  });

  it("falls back to straight-line order when the matrix is not enabled", async () => {
    matrix.mockRejectedValue(Object.assign(new Error("Not Found"), { status: 404 }));
    render(<PlacesApp />);
    await screen.findByText(/Travel times are not enabled on this API deployment/);
    expect(rowIds()[0]).toBe("kensington");
  });
});
