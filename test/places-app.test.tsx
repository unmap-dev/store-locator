// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

// No key in the test build: the app must explain how to get one instead of calling anything.
vi.mock("@/lib/kit/config", async (orig) => ({ ...(await orig<typeof import("@/lib/kit/config")>()), API_KEY: "" }));

import { PlacesApp } from "../components/places/places-app";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("Places without a key", () => {
  it("shows the stores, labels them sample data, and asks for a key instead of a map", () => {
    render(<PlacesApp />);
    expect(screen.getByText("This demo needs an Unmap API key")).toBeTruthy();
    const list = screen.getByRole("list", { name: "Branches" });
    expect(within(list).getAllByRole("listitem").length).toBe(20);
    expect(screen.getAllByText("Sample data").length).toBeGreaterThan(0);
  });

  it("filters by service and selects a branch into the URL", () => {
    render(<PlacesApp />);
    fireEvent.click(screen.getByRole("button", { name: "EV charging" }));
    const list = screen.getByRole("list", { name: "Branches" });
    const rows = within(list).getAllByRole("button");
    expect(rows.length).toBeLessThan(20);
    fireEvent.click(rows[0]!);
    expect(window.location.search).toMatch(/store=/);
    expect(document.querySelector("[data-store-details]")).toBeTruthy();
  });

  it("switches to French", () => {
    render(<PlacesApp />);
    fireEvent.click(screen.getByRole("button", { name: "Français" }));
    expect(screen.getByText("Cette démo a besoin d'une clé d'API Unmap")).toBeTruthy();
    expect(window.location.search).toBe("?lang=fr");
  });
});

describe("loading your own stores", () => {
  it("validates the file in the browser and labels it as yours", async () => {
    const { waitFor } = await import("@testing-library/react");
    render(<PlacesApp />);
    const input = document.querySelector<HTMLInputElement>("[data-store-file]")!;
    const good = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [-113.49, 53.54] }, properties: { id: "yeg", name: "Edmonton shop", address: "1 Jasper Ave" } }] };
    fireEvent.change(input, { target: { files: [new File([JSON.stringify(good)], "mine.geojson", { type: "application/geo+json" })] } });
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Branches" })).getAllByRole("listitem")).toHaveLength(1));
    expect(screen.getByText("1 stores from mine.geojson")).toBeTruthy();

    fireEvent.change(input, { target: { files: [new File(['{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[999,0]},"properties":{}}]}'], "bad.json")] } });
    await screen.findByText("The file was not loaded:");
    expect(screen.getByText(/coordinates must be \[longitude, latitude\]/)).toBeTruthy();
    // The bad file leaves the good one in place.
    expect(within(screen.getByRole("list", { name: "Branches" })).getAllByRole("listitem")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Back to the sample" }));
    expect(within(screen.getByRole("list", { name: "Branches" })).getAllByRole("listitem")).toHaveLength(20);
  });
});
