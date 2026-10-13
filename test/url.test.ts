import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, parseState, writeState } from "../lib/url";

describe("url state", () => {
  it("round-trips a search, branch, mode and sort, keeping other keys", () => {
    const state = { origin: { coordinates: [-114.0719, 51.0447] as [number, number], label: "Calgary Tower" }, store: "beltline", mode: "pedestrian" as const, sort: "distance" as const };
    const search = writeState("?lang=fr", state);
    expect(search).toBe("?lang=fr&from=-114.0719,51.0447&label=Calgary+Tower&store=beltline&mode=pedestrian&sort=distance");
    expect(parseState(search)).toEqual(state);
  });

  it("writes nothing for the defaults", () => {
    expect(writeState("", DEFAULT_STATE)).toBe("");
  });

  it("ignores a malformed or out-of-range origin and unknown values", () => {
    expect(parseState("?from=abc&mode=teleport&sort=x")).toEqual(DEFAULT_STATE);
    expect(parseState("?from=-200,51").origin).toBeNull();
    expect(parseState("?from=-114,51").origin?.label).toBe("51, -114");
  });
});
