import * as XLSX from "xlsx";

export function detectMode(route = {}) {
  const raw = `${route.route_type ?? ""} ${route.route_short_name ?? ""} ${route.route_long_name ?? ""}`.toLowerCase();

  if (
    [1, "1"].includes(route.route_type) ||
    raw.includes("metro") ||
    raw.includes("blue") ||
    raw.includes("red") ||
    raw.includes("green")
  ) {
    return "Metro";
  }

  return "Bus";
}

export function routeColor(route = {}) {
  const c = route.route_color;
  if (c && /^[0-9a-fA-F]{6}$/.test(c)) return `#${c}`;
  return detectMode(route) === "Metro" ? "#2563eb" : "#059669";
}

export async function parseGTFSWorkbook(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });

  const readSheet = (name) =>
    wb.SheetNames.includes(name)
      ? XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" })
      : [];

  const routes = readSheet("routes.txt");
  const stops = readSheet("stops.txt");
  const trips = readSheet("trips.txt");
  const stopTimes = readSheet("stop_times.txt");
  const feedInfo = readSheet("feed_info.txt");

  return {
    routes,
    stops,
    trips,
    stopTimes,
    feedInfo,
    feedName: feedInfo?.[0]?.feed_publisher_name || file.name,
  };
}

export function buildTransitGraph({ routes, stops, trips, stopTimes }) {
  const stopMap = Object.fromEntries(stops.map((s) => [String(s.stop_id), s]));
  const routeMap = Object.fromEntries(routes.map((r) => [String(r.route_id), r]));

  const tripsByRoute = {};
  for (const t of trips) {
    const rid = String(t.route_id);
    if (!tripsByRoute[rid]) tripsByRoute[rid] = [];
    tripsByRoute[rid].push(t);
  }

  const stopTimesByTrip = {};
  for (const st of stopTimes) {
    const tid = String(st.trip_id);
    if (!stopTimesByTrip[tid]) stopTimesByTrip[tid] = [];
    stopTimesByTrip[tid].push(st);
  }

  Object.values(stopTimesByTrip).forEach((arr) => {
    arr.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
  });

  const routeStopIds = {};
  for (const r of routes) {
    const rid = String(r.route_id);
    const trip = (tripsByRoute[rid] || [])[0];
    if (!trip) continue;
    routeStopIds[rid] = [
      ...new Set((stopTimesByTrip[String(trip.trip_id)] || []).map((x) => String(x.stop_id))),
    ];
  }

  const stopRouteIds = {};
  for (const [rid, sids] of Object.entries(routeStopIds)) {
    for (const sid of sids) {
      if (!stopRouteIds[sid]) stopRouteIds[sid] = [];
      stopRouteIds[sid].push(rid);
    }
  }

  const enrichedRoutes = routes.map((r) => ({
    ...r,
    mode: detectMode(r),
    color: routeColor(r),
    shortName: r.route_short_name || r.route_id,
    longName: r.route_long_name || "Unnamed Route",
    stopsCount: (routeStopIds[String(r.route_id)] || []).length,
  }));

  const enrichedStops = stops.map((s) => {
    const rids = stopRouteIds[String(s.stop_id)] || [];
    const modes = [...new Set(rids.map((rid) => detectMode(routeMap[rid] || {})))];
    return {
      ...s,
      name: s.stop_name || s.stop_id,
      routeIds: rids,
      modes,
    };
  });

  return {
    stopMap,
    routeMap,
    tripsByRoute,
    stopTimesByTrip,
    routeStopIds,
    stopRouteIds,
    enrichedRoutes,
    enrichedStops,
  };
}
