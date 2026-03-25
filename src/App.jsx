import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPinned,
  Route,
  Upload,
  Layers,
  Bus,
  Train,
  Clock3,
  Network,
  Filter,
  Navigation,
  Database,
} from "lucide-react";

import { parseGTFSWorkbook, buildTransitGraph } from "@/lib/gtfs";
import StatCard from "@/components/StatCard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function App() {
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("All");
  const [view, setView] = useState("network");
  const [gtfsLoaded, setGtfsLoaded] = useState(false);
  const [feedName, setFeedName] = useState("");

  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stopTimes, setStopTimes] = useState([]);

  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null);

  const graph = useMemo(() => {
    return buildTransitGraph({ routes, stops, trips, stopTimes });
  }, [routes, stops, trips, stopTimes]);

  const {
    stopMap,
    routeMap,
    routeStopIds,
    enrichedRoutes,
    enrichedStops,
  } = graph;

  const filteredRoutes = useMemo(() => {
    return enrichedRoutes.filter((r) => {
      const q = `${r.shortName} ${r.longName}`.toLowerCase().includes(query.toLowerCase());
      const m = modeFilter === "All" || r.mode === modeFilter;
      return q && m;
    });
  }, [enrichedRoutes, query, modeFilter]);

  const filteredStops = useMemo(() => {
    return enrichedStops.filter((s) => {
      const q = `${s.name}`.toLowerCase().includes(query.toLowerCase());
      const m = modeFilter === "All" || s.modes.includes(modeFilter);
      return q && m;
    });
  }, [enrichedStops, query, modeFilter]);

  const selectedRoute =
    enrichedRoutes.find((r) => String(r.route_id) === String(selectedRouteId)) ||
    filteredRoutes[0] ||
    null;

  const selectedStop =
    enrichedStops.find((s) => String(s.stop_id) === String(selectedStopId)) ||
    filteredStops[0] ||
    null;

  const selectedRouteStops = selectedRoute
    ? (routeStopIds[String(selectedRoute.route_id)] || [])
        .map((id) => stopMap[id])
        .filter(Boolean)
    : [];

  const selectedStopRoutes = selectedStop
    ? (selectedStop.routeIds || []).map((id) => routeMap[id]).filter(Boolean)
    : [];

  const handleXlsxUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parsed = await parseGTFSWorkbook(file);

    setRoutes(parsed.routes);
    setStops(parsed.stops);
    setTrips(parsed.trips);
    setStopTimes(parsed.stopTimes);
    setFeedName(parsed.feedName);
    setGtfsLoaded(true);

    if (parsed.routes[0]) setSelectedRouteId(String(parsed.routes[0].route_id));
    if (parsed.stops[0]) setSelectedStopId(String(parsed.stops[0].stop_id));
  };

  const stats = {
    routes: routes.length || "—",
    stops: stops.length || "—",
    trips: trips.length || "—",
    stopTimes: stopTimes.length || "—",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="rounded-xl bg-cyan-600 hover:bg-cyan-600">Hyderabad City</Badge>
              <Badge variant="secondary" className="rounded-xl">Metro + Bus</Badge>
              {gtfsLoaded && (
                <Badge variant="outline" className="rounded-xl">
                  Loaded: {feedName}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Hyderabad Transit Explorer Pro
            </h1>
            <p className="text-slate-600 mt-1">
              GTFS-powered route-stop explorer for Hyderabad Metro and city buses.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white cursor-pointer hover:opacity-90 transition w-fit">
            <Upload className="w-4 h-4" />
            Upload GTFS XLSX
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxUpload} />
          </label>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Routes" value={stats.routes} icon={Route} subtitle="Bus + Metro combined" />
          <StatCard title="Stops" value={stats.stops} icon={MapPinned} subtitle="Stations and bus stops" />
          <StatCard title="Trips" value={stats.trips} icon={Bus} subtitle="Scheduled trips" />
          <StatCard title="Stop Times" value={stats.stopTimes} icon={Database} subtitle="Loaded from GTFS" />
        </div>

        <Card className="rounded-3xl border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4 md:p-5 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search routes, stations, bus stops, corridors..."
                className="pl-10 h-12 rounded-2xl border-slate-200"
              />
            </div>

            <div className="flex gap-3">
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Modes</SelectItem>
                  <SelectItem value="Bus">Bus Only</SelectItem>
                  <SelectItem value="Metro">Metro Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="w-[180px] h-12 rounded-2xl">
                  <Network className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="network">Network View</SelectItem>
                  <SelectItem value="map">Map View</SelectItem>
                  <SelectItem value="spider">Spider View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Card className="rounded-3xl border-0 shadow-sm bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="routes" className="w-full">
                  <TabsList className="grid grid-cols-2 rounded-2xl w-full">
                    <TabsTrigger value="routes">Routes</TabsTrigger>
                    <TabsTrigger value="stops">Stops</TabsTrigger>
                  </TabsList>

                  <TabsContent value="routes" className="mt-4 space-y-3 max-h-[560px] overflow-auto pr-1">
                    {filteredRoutes.map((route) => (
                      <button
                        key={route.route_id}
                        onClick={() => setSelectedRouteId(String(route.route_id))}
                        className={`w-full text-left p-4 rounded-2xl border transition ${
                          String(selectedRouteId) === String(route.route_id)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ background: route.color }} />
                              <p className="font-semibold">{route.shortName}</p>
                            </div>
                            <p className={`text-sm mt-1 ${
                              String(selectedRouteId) === String(route.route_id)
                                ? "text-slate-200"
                                : "text-slate-500"
                            }`}>
                              {route.longName}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-xl">{route.mode}</Badge>
                        </div>
                      </button>
                    ))}
                  </TabsContent>

                  <TabsContent value="stops" className="mt-4 space-y-3 max-h-[560px] overflow-auto pr-1">
                    {filteredStops.map((stop) => (
                      <button
                        key={stop.stop_id}
                        onClick={() => setSelectedStopId(String(stop.stop_id))}
                        className={`w-full text-left p-4 rounded-2xl border transition ${
                          String(selectedStopId) === String(stop.stop_id)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <p className="font-semibold">{stop.name}</p>
                        <p className={`text-sm mt-1 ${
                          String(selectedStopId) === String(stop.stop_id)
                            ? "text-slate-200"
                            : "text-slate-500"
                        }`}>
                          Modes: {stop.modes.join(", ") || "—"}
                        </p>
                      </button>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {selectedRoute && (
              <Card className="rounded-3xl border-0 shadow-sm bg-white/80">
                <CardHeader>
                  <CardTitle>Selected Route</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedRoute.mode === "Metro" ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                      <p className="text-2xl font-bold">{selectedRoute.shortName}</p>
                    </div>
                    <p className="text-slate-600">{selectedRoute.longName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="rounded-xl">{selectedRoute.mode}</Badge>
                    <Badge variant="secondary" className="rounded-xl">
                      {selectedRoute.stopsCount} Stops
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="xl:col-span-9 space-y-6">
            <Card className="rounded-3xl border-0 shadow-sm bg-white/80 overflow-hidden">
              <CardHeader>
                <CardTitle>
                  {view === "spider"
                    ? "Spider Connectivity View"
                    : view === "map"
                    ? "Map-ready Stop View"
                    : "Interactive Transit Network"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[520px] rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 overflow-auto">
                  {selectedRoute ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Navigation className="w-6 h-6 text-slate-500" />
                        <h3 className="text-xl font-semibold">{selectedRoute.shortName} stop sequence</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3">
                        {selectedRouteStops.map((s, idx) => (
                          <button
                            key={`${s.stop_id}-${idx}`}
                            onClick={() => setSelectedStopId(String(s.stop_id))}
                            className="p-3 rounded-2xl bg-white border hover:bg-slate-50 text-left"
                          >
                            <div className="text-xs text-slate-500">#{idx + 1}</div>
                            <div className="font-semibold">{s.stop_name}</div>
                            <div className="text-sm text-slate-500">
                              {s.stop_lat}, {s.stop_lon}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      Upload GTFS XLSX to start exploring.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedStop && (
                <Card className="rounded-3xl border-0 shadow-sm bg-white/80">
                  <CardHeader>
                    <CardTitle>Selected Stop</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xl font-semibold">{selectedStop.name}</p>
                    <p className="text-slate-600">
                      Lat: {selectedStop.stop_lat} | Lon: {selectedStop.stop_lon}
                    </p>
                    <p className="text-slate-600">Modes: {selectedStop.modes.join(", ") || "—"}</p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedStopRoutes.slice(0, 20).map((r) => (
                        <Badge key={r.route_id} variant="secondary" className="rounded-xl">
                          {r.route_short_name || r.route_id}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-3xl border-0 shadow-sm bg-white/80">
                <CardHeader>
                  <CardTitle>Ready Next Upgrade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>• Add exact route map lines using shapes.txt</p>
                  <p>• Add real Leaflet/OpenStreetMap view</p>
                  <p>• Add stop cluster and interchange graph</p>
                  <p>• Add trip direction filters</p>
                  <p>• Add deploy branding for Hyderabad Transit</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
