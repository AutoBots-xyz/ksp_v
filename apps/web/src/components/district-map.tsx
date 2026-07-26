'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * DistrictMap — interactive Karnataka district choropleth with drill-down.
 *
 * Phase 1.1: replaces the <select> dropdown in district/page.tsx.
 * - Loads district boundary GeoJSON from /karnataka-districts.geojson (served from public/).
 * - Clicking a district polygon fires onDistrictSelect(districtId, districtName),
 *   which the parent wires to a real filtered case query (NOT just a visual zoom).
 * - If station points are provided, renders them as clickable CircleMarkers within
 *   the selected district for station-level drill-down.
 *
 * Source boundaries are simplified buffers (see datastore/seeds/karnataka-districts.geojson
 * metadata); swap with official GADM level-2 polygons before production.
 */

interface StationPoint {
  unitId: number;
  name: string;
  lat: number;
  lng: number;
  caseCount?: number;
}

interface DistrictMapProps {
  selectedDistrictId: number | null;
  onDistrictSelect: (districtId: number, districtName: string) => void;
  /** Optional station markers to render when a district is selected. */
  stationPoints?: StationPoint[];
  /** Optional case incident points to overlay (lat/lng) for hotspot context. */
  incidentPoints?: Array<{ lat: number; lng: number; label?: string }>;
  /** Choropleth intensity per districtId (0..1) for color shading. */
  intensityByDistrict?: Record<number, number>;
  className?: string;
}

// Fix Leaflet default marker icon path resolution under bundlers.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const KARNATAKA_CENTER: [number, number] = [15.3173, 75.7139];

function FitToSelectedDistrict({ geo, selectedId }: { geo: FeatureCollection | null; selectedId: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geo || !selectedId) return;
    const feature = geo.features.find(
      (f) => f.properties?.districtId === selectedId,
    ) as Feature | undefined;
    if (!feature) return;
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  }, [geo, selectedId, map]);
  return null;
}

export function DistrictMap({
  selectedDistrictId,
  onDistrictSelect,
  stationPoints = [],
  incidentPoints = [],
  intensityByDistrict = {},
  className,
}: DistrictMapProps) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/karnataka-districts.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<FeatureCollection>;
      })
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load district boundaries');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const styleFor = useMemo(() => {
    return (feature: Feature | undefined) => {
      const id = feature?.properties?.districtId as number | undefined;
      const isSelected = id === selectedDistrictId;
      const intensity = id != null ? intensityByDistrict[id] ?? 0 : 0;
      // Choropleth: light base, deeper red with higher intensity.
      const fill = isSelected
        ? '#2563eb'
        : `hsl(0, ${Math.round(30 + intensity * 50)}%, ${Math.round(85 - intensity * 30)}%)`;
      return {
        fillColor: fill,
        weight: isSelected ? 3 : 1,
        opacity: 1,
        color: isSelected ? '#1d4ed8' : '#64748b',
        fillOpacity: isSelected ? 0.35 : 0.4 + intensity * 0.4,
      };
    };
  }, [selectedDistrictId, intensityByDistrict]);

  if (loadError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
        Map boundary load failed: {loadError}. Ensure /karnataka-districts.geojson is in public/.
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '50vh', minHeight: 300, maxHeight: 500, width: '100%' }}>
      <MapContainer center={KARNATAKA_CENTER} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geo && (
          <GeoJSON
            data={geo}
            style={styleFor}
            onEachFeature={(feature, layer) => {
              const id = feature.properties?.districtId as number | undefined;
              const name = feature.properties?.districtName as string | undefined;
              layer.bindTooltip(name ?? 'District', { sticky: true });
              layer.on({
                click: () => {
                  if (id != null && name) onDistrictSelect(id, name);
                },
              });
            }}
          />
        )}
        <FitToSelectedDistrict geo={geo} selectedId={selectedDistrictId} />

        {stationPoints.map((s) => (
          <CircleMarker
            key={s.unitId}
            center={[s.lat, s.lng]}
            radius={6 + Math.min((s.caseCount ?? 0) / 20, 8)}
            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.caseCount != null ? `${s.caseCount} cases` : 'Station'}
            </Popup>
          </CircleMarker>
        ))}

        {incidentPoints.map((p, i) => (
          <CircleMarker
            key={`inc-${i}`}
            center={[p.lat, p.lng]}
            radius={4}
            pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.6 }}
          >
            {p.label && <Popup>{p.label}</Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
