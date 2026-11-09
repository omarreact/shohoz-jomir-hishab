import { isVisitorChatHiddenOnRoute } from "./visitorChatVisibility";

describe("visitor AI chat visibility", () => {
  it.each(["/geospatial-map", "/geospatial-map/", "/geospatial-map/debug"])(
    "does not overlay the map workspace at %s",
    (path) => expect(isVisitorChatHiddenOnRoute(path)).toBe(true),
  );

  it.each(["/", "/mouza-map", "/rajuk-test", "/geospatial-map-other", "/admin/ai-assistant", null])(
    "preserves the assistant on non-geospatial routes %s",
    (path) => expect(isVisitorChatHiddenOnRoute(path)).toBe(false),
  );
});
