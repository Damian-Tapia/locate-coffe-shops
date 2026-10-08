"use client";

import { Component, createRef, useState, type ChangeEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type * as LeafletNS from "leaflet";
import {
  Button,
  FilterChip,
  Icon,
  IconButton,
  MapPin,
  SegmentedControl,
  ShopCard,
  StatusBadge,
  Toast,
  UserLocation,
  type SegmentedOption,
  type ShopStatus,
} from "@/components/ds";

let leafletPromise: Promise<typeof LeafletNS> | null = null;
function loadLeaflet(): Promise<typeof LeafletNS> {
  if (!leafletPromise) leafletPromise = import("leaflet");
  return leafletPromise;
}

interface Shop {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  status: ShopStatus;
  statusText: string;
  addr: string;
  hours: string;
  phone: string;
  web: string;
  tags: string[];
}

interface ShopWithDist extends Shop {
  m: number;
  distance: string;
  walk: string;
}

interface RatingEntry {
  score: number;
  note: string;
  date: string;
  shop: Shop;
}

type Source = "" | "live" | "cache" | "demo" | "offline";
type Stage = "onboarding" | "permission" | "app";

interface AppState {
  mounted: boolean;
  stage: Stage;
  step: number;
  chars: number;
  user: { lat: number; lng: number } | null;
  shops: ShopWithDist[];
  loading: boolean;
  source: Source;
  tab: "Cerca" | "Mis";
  activeId: string | null;
  rateOpen: boolean;
  draftScore: number;
  draftNote: string;
  ratings: Record<string, RatingEntry>;
  toast: { t: string; icon: string } | null;
  buddy: boolean;
  tick: number;
  sheetY: number;
  dragging: boolean;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const LINES: { t: string; m: "happy" | "smile" | "mad" | "talking" }[] = [
  { t: "Que rollo Barbie...", m: "happy" },
  { t: "evidentemente si estas usando esto ya estas del otro lado del oceano,", m: "smile" },
  {
    t: "solemos buscar cafes buenos cuando andamos por aca pero viendo la situacion que estas al menos a 8 horas de distancia pues se complica un poco...",
    m: "mad",
  },
  { t: "asi que hice esta app para ayudarte a encontrar cafes buenos ya que no ando por alla", m: "smile" },
  { t: "Te enseño los cafés más cercanos en el mapa. Cuando pruebes uno, califícalo y deja tu opinión, como siempre.", m: "happy" },
];

const DEMO_USER = { lat: 41.8992, lng: 12.477 };

const DEMO_SHOPS: Shop[] = [
  { id: "fontana", name: "Caffè della Fontana", area: "Trevi", lat: 41.9006, lng: 12.4795, status: "open", statusText: "Abierto hasta 20:30", addr: "Via delle Muratte 41", hours: "Lun–Vie 06:30–20:30 · Sáb 07:00–21:00 · Dom 08:00–14:00", phone: "+39 06 679 1234", web: "", tags: ["Al banco", "Cornetti", "Wi-Fi"] },
  { id: "pigna", name: "Torrefazione Pigna", area: "Pigna", lat: 41.8979, lng: 12.4786, status: "closing", statusText: "Cierra en 25 min", addr: "Via della Pigna 12", hours: "Lun–Sáb 07:30–19:00 · Dom cerrado", phone: "", web: "", tags: ["Tostador", "Café en grano"] },
  { id: "portico", name: "Bar del Portico", area: "Colonna", lat: 41.901, lng: 12.4752, status: "open", statusText: "Abierto hasta 23:00", addr: "Piazza di Pietra 8", hours: "Todos los días 07:00–23:00", phone: "", web: "", tags: ["Terraza"] },
  { id: "minerva", name: "Caffè Minerva", area: "Sant'Eustachio", lat: 41.8975, lng: 12.4747, status: "open", statusText: "Abierto hasta 21:00", addr: "Via di Santa Chiara 5", hours: "Todos los días 07:00–21:00", phone: "", web: "", tags: ["Leche de avena", "Wi-Fi"] },
  { id: "navona", name: "Latteria Navona", area: "Parione", lat: 41.8988, lng: 12.472, status: "closed", statusText: "Abre 07:00", addr: "Via del Governo Vecchio 70", hours: "Mar–Dom 07:00–15:00 · Lun cerrado", phone: "", web: "", tags: ["Desayuno", "Maritozzi"] },
];

const RADIUS_M = 1200;
const TYPE_SPEED_MS = 28;
// Lo que queda visible del panel cuando esta abatido: solo el asa.
const SHEET_PEEK = 36;

function SkipButton({ onClick, children }: { onClick: (e: MouseEvent<HTMLButtonElement>) => void; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top: 28,
        right: "50%",
        transform: "translateX(50%)",
        height: 36,
        padding: "0 16px",
        border: 0,
        borderRadius: "var(--radius-pill)",
        background: hover ? "var(--travertine-100)" : "var(--surface-raised)",
        boxShadow: "var(--shadow-xs)",
        font: "600 14px/1 var(--font-sans)",
        color: "var(--text-body)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CupButton({ color, onClick }: { color: string; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  return (
    <button
      aria-label="Calificar"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        width: 48,
        height: 48,
        border: 0,
        borderRadius: "50%",
        background: hover ? "var(--travertine-100)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transform: active ? "scale(0.92)" : "none",
      }}
    >
      <Icon name="coffee" size={30} color={color} />
    </button>
  );
}

function NoteTextarea({ value, onChange }: { value: string; onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder="El cortado, el lugar, si volverías…"
      rows={3}
      style={{
        width: "100%",
        boxSizing: "border-box",
        resize: "none",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1.5px solid " + (focus ? "var(--border-focus)" : "var(--border-default)"),
        background: "var(--surface-raised)",
        font: "var(--type-quote)",
        fontSize: 17,
        color: "var(--text-strong)",
        outline: "none",
        boxShadow: focus ? "var(--ring-focus)" : "none",
      }}
    />
  );
}

interface MineEntry {
  id: string;
  area: string;
  date: string;
  name: string;
  cups: { key: number; color: string }[];
  hasNote: boolean;
  note: string;
  onClick: () => void;
}

function MisRow({ r }: { r: MineEntry }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={r.onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gap: 8,
        padding: "14px 16px",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-xs)",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--text-muted)" }}>{r.area}</div>
        <div style={{ font: "var(--type-data)", fontSize: 12, color: "var(--text-muted)" }}>{r.date}</div>
      </div>
      <div style={{ font: "400 21px/1.15 var(--font-display)", color: "var(--text-strong)" }}>{r.name}</div>
      <div style={{ display: "flex", gap: 3 }}>
        {r.cups.map((c) => (
          <Icon key={c.key} name="coffee" size={18} color={c.color} />
        ))}
      </div>
      {r.hasNote && <div style={{ font: "var(--type-quote)", fontSize: 16, color: "var(--text-body)", textWrap: "pretty" }}>&ldquo;{r.note}&rdquo;</div>}
    </div>
  );
}

function sprite(mood: string, h: number) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={"/assets/sprite_" + mood + ".png"}
      alt=""
      draggable={false}
      style={{ height: h, width: "auto", display: "block", imageRendering: "pixelated", animation: "bc-bob 1.2s steps(1) infinite" }}
    />
  );
}

type Cache = { user: { lat: number; lng: number }; ts: number; shops: Shop[] };

function readRatings(): Record<string, RatingEntry> {
  if (typeof localStorage === "undefined") return {};
  try {
    const r = JSON.parse(localStorage.getItem("bc-ratings") || "{}");
    return r && typeof r === "object" ? r : {};
  } catch {
    return {};
  }
}

// Valida la forma, no solo el JSON: una entrada vieja sin `user` reventaba
// dist() dentro del callback de geolocalización y el mapa no se creaba nunca.
function readCache(): Cache | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const c = JSON.parse(localStorage.getItem("bc-cache") || "null");
    if (!c || typeof c.ts !== "number" || !Array.isArray(c.shops)) return null;
    if (!c.user || typeof c.user.lat !== "number" || typeof c.user.lng !== "number") return null;
    return c as Cache;
  } catch {
    return null;
  }
}

export class CoffeeApp extends Component<Record<string, never>, AppState> {
  state: AppState = {
    mounted: false,
    stage: "onboarding",
    step: 0,
    chars: 0,
    user: null,
    shops: [],
    loading: false,
    source: "",
    tab: "Cerca",
    activeId: null,
    rateOpen: false,
    draftScore: 0,
    draftNote: "",
    ratings: {},
    toast: null,
    buddy: false,
    tick: 0,
    sheetY: 0,
    dragging: false,
  };

  mapEl = createRef<HTMLDivElement>();
  sheetEl = createRef<HTMLDivElement>();
  drag: { y: number; base: number; moved: boolean } | null = null;
  map: LeafletNS.Map | null = null;
  ti: ReturnType<typeof setInterval> | undefined;
  tt: ReturnType<typeof setTimeout> | undefined;
  bt: ReturnType<typeof setTimeout> | undefined;
  rt: ReturnType<typeof setTimeout> | undefined;

  componentDidMount() {
    const stage = ((typeof localStorage !== "undefined" && (localStorage.getItem("bc-stage") as Stage)) || "onboarding") as Stage;
    this.setState({ mounted: true, stage, ratings: readRatings() }, () => {
      if (stage === "onboarding") this.startTyping();
      if (stage === "app") this.locate(false);
    });
  }

  componentWillUnmount() {
    clearInterval(this.ti);
    clearTimeout(this.tt);
    clearTimeout(this.bt);
    clearTimeout(this.rt);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  go(stage: Stage) {
    localStorage.setItem("bc-stage", stage);
    if (stage !== "app" && this.map) {
      this.map.remove();
      this.map = null;
    }
    this.setState({ stage });
  }

  startTyping = () => {
    clearInterval(this.ti);
    this.setState({ chars: 0 });
    this.ti = setInterval(() => {
      this.setState((s) => {
        const L = LINES[s.step].t.length;
        if (s.chars >= L) {
          clearInterval(this.ti);
          return null;
        }
        return { chars: s.chars + 1 };
      });
    }, TYPE_SPEED_MS);
  };

  advance = () => {
    const s = this.state;
    const L = LINES[s.step].t.length;
    if (s.chars < L) {
      clearInterval(this.ti);
      this.setState({ chars: L });
      return;
    }
    if (s.step < LINES.length - 1) this.setState({ step: s.step + 1 }, () => this.startTyping());
  };

  skip = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    clearInterval(this.ti);
    this.go("permission");
  };

  finishOnb = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    this.go("permission");
  };

  dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const r = Math.PI / 180;
    const dl = (b.lat - a.lat) * r;
    const dn = (b.lng - a.lng) * r;
    const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
    return 2 * 6371e3 * Math.asin(Math.sqrt(x));
  }

  withDist(list: Shop[], u: { lat: number; lng: number }): ShopWithDist[] {
    return list
      .map((s) => {
        const m = Math.round(this.dist(u, s));
        return {
          ...s,
          m,
          distance: m < 1000 ? m + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km",
          walk: Math.max(1, Math.round(m / 80)) + " min",
        };
      })
      .sort((a, b) => a.m - b.m);
  }

  async fetchCafes(u: { lat: number; lng: number }): Promise<Shop[]> {
    const q = `[out:json][timeout:20];(node["amenity"="cafe"](around:${RADIUS_M},${u.lat},${u.lng});way["amenity"="cafe"](around:${RADIUS_M},${u.lat},${u.lng}););out center tags 80;`;
    // [timeout:20] es presupuesto del servidor, no de red: Overpass encola bajo
    // rate limit y el fetch se quedaba colgado para siempre.
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(q),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error("overpass");
    const j = await r.json();
    const elements: OverpassElement[] = j.elements || [];
    return elements
      .filter((e) => e.tags && e.tags.name)
      .map((e) => {
        const t = e.tags!;
        return {
          id: "osm" + e.id,
          name: t.name,
          lat: e.lat ?? e.center!.lat,
          lng: e.lon ?? e.center!.lon,
          area: t["addr:suburb"] || t["addr:city"] || "",
          addr: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" "),
          hours: t.opening_hours || "",
          phone: t.phone || t["contact:phone"] || "",
          web: t.website || t["contact:website"] || "",
          tags: [
            t.internet_access && t.internet_access !== "no" ? "Wi-Fi" : null,
            t.outdoor_seating === "yes" ? "Terraza" : null,
            t["diet:vegan"] === "yes" ? "Vegano" : null,
          ].filter((x): x is string => Boolean(x)),
          status: "info" as ShopStatus,
          statusText: t.opening_hours ? "Ver horario" : "Sin horario",
        };
      });
  }

  locate(demo: boolean, force?: boolean) {
    this.go("app");
    this.setState({ loading: true });
    const done = (user: { lat: number; lng: number }, shops: Shop[], source: Source) =>
      this.setState({ user, shops: this.withDist(shops, user), source, loading: false }, () => this.initMap());

    if (demo || typeof navigator === "undefined" || !navigator.geolocation) {
      done(DEMO_USER, DEMO_SHOPS, "demo");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        try {
          const user = { lat: p.coords.latitude, lng: p.coords.longitude };
          // El mapa solo necesita un centro. Dibújalo ya; los cafés llegan después.
          this.setState({ user }, this.initMap);

          const c = readCache();
          const near = c ? this.dist(c.user, user) < 400 : false;
          const fresh = c && near ? Date.now() - c.ts < 6 * 3600e3 : false;

          if (!force && c && fresh) {
            done(user, c.shops, "cache");
            return;
          }
          this.fetchCafes(user).then(
            (shops) => {
              try {
                localStorage.setItem("bc-cache", JSON.stringify({ user, ts: Date.now(), shops }));
              } catch {
                // Cuota llena: la lista sigue sirviendo en memoria.
              }
              done(user, shops, "live");
            },
            () => {
              // Solo reutiliza caché cercana: una lista de otra ciudad mostraría
              // distancias recalculadas sobre la posición actual.
              if (c && near) {
                done(user, c.shops, "cache");
                this.flash("Sin conexión · lista guardada", "wifi-off");
              } else {
                // Conservar la posicion real: caer a DEMO_USER devolvia el mapa a Roma
                // despues de haberlo centrado bien.
                done(user, [], "offline");
                this.flash("Sin conexión · intenta de nuevo", "wifi-off");
              }
            },
          );
        } catch (e) {
          // done() debe correr siempre: es el único camino hacia initMap().
          console.error("[locate] fallo tras obtener ubicación", e);
          done({ lat: p.coords.latitude, lng: p.coords.longitude }, [], "offline");
          this.flash("Sin conexión · intenta de nuevo", "wifi-off");
        }
      },
      () => {
        done(DEMO_USER, DEMO_SHOPS, "demo");
        this.flash("Sin ubicación · ejemplo en Roma", "map-pin");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  initMap = () => {
    const u = this.state.user;
    if (!u) return;
    if (!this.mapEl.current) {
      this.rt = setTimeout(this.initMap, 150);
      return;
    }
    if (this.map) {
      this.map.setView([u.lat, u.lng], 16);
      return;
    }
    loadLeaflet()
      .then((L) => {
        if (!this.mapEl.current || this.map) return;
        // Asignar antes de añadir capas: L.map() ya marcó el nodo con _leaflet_id,
        // así que si una capa lanza y this.map quedara null, cada intento posterior
        // moriría con "Map container is already initialized".
        const m = L.map(this.mapEl.current, { zoomControl: false, attributionControl: false });
        this.map = m;
        m.setView([u.lat, u.lng], 16);
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19 }).addTo(m);
        m.on("move zoom resize", () => this.setState((s) => ({ tick: s.tick + 1 })));
        this.forceUpdate();
      })
      .catch((e) => {
        console.error("[map] no se pudo inicializar Leaflet", e);
        this.flash("No se pudo cargar el mapa", "wifi-off");
      });
  };

  pt(lat: number, lng: number): { left: string; top: string } {
    const p = this.map ? this.map.latLngToContainerPoint([lat, lng]) : { x: -200, y: -200 };
    return { left: p.x + "px", top: p.y + "px" };
  }

  // Recorrido del gesto: alto real del panel menos el asa que se queda a la vista.
  sheetMax() {
    const h = this.sheetEl.current ? this.sheetEl.current.offsetHeight : 0;
    return Math.max(0, h - SHEET_PEEK);
  }

  sheetDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    this.drag = { y: e.clientY, base: this.state.sheetY, moved: false };
    this.setState({ dragging: true });
  };

  sheetMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!this.drag) return;
    const dy = e.clientY - this.drag.y;
    if (Math.abs(dy) > 4) this.drag.moved = true;
    this.setState({ sheetY: Math.min(this.sheetMax(), Math.max(0, this.drag.base + dy)) });
  };

  sheetUp = () => {
    if (!this.drag) return;
    const moved = this.drag.moved;
    this.drag = null;
    const max = this.sheetMax();
    // Arrastre: suelta hacia el extremo mas cercano. Toque sin arrastre: alterna.
    this.setState((st) => ({ sheetY: moved ? (st.sheetY > max / 2 ? max : 0) : st.sheetY > 0 ? 0 : max, dragging: false }));
  };

  flash(t: string, icon?: string) {
    this.setState({ toast: { t, icon: icon || "check" } });
    clearTimeout(this.tt);
    this.tt = setTimeout(() => this.setState({ toast: null }), 2600);
  }

  select(id: string) {
    const s = this.state.shops.find((x) => x.id === id) || this.state.ratings[id]?.shop;
    this.setState({ activeId: id, rateOpen: false });
    if (this.map && s) this.map.panTo([s.lat - 0.0018, s.lng], { animate: true });
  }

  current(): ShopWithDist | Shop | null {
    const s = this.state;
    if (!s.activeId) return null;
    const live = s.shops.find((x) => x.id === s.activeId);
    if (live) return live;
    const r = s.ratings[s.activeId];
    if (!r) return null;
    return s.user ? this.withDist([r.shop], s.user)[0] : r.shop;
  }

  openRate = () => {
    const activeId = this.state.activeId;
    const r = activeId ? this.state.ratings[activeId] : undefined;
    this.setState({ rateOpen: true, draftScore: r ? r.score : 0, draftNote: r ? r.note : "" });
  };

  saveRate = () => {
    const s = this.state;
    const d = this.current();
    if (!s.draftScore || !d) return;
    const ratings: Record<string, RatingEntry> = {
      ...s.ratings,
      [d.id]: {
        score: s.draftScore,
        note: s.draftNote.trim(),
        date: new Date().toISOString(),
        shop: { id: d.id, name: d.name, area: d.area, lat: d.lat, lng: d.lng, addr: d.addr, hours: d.hours, phone: d.phone, web: d.web, tags: d.tags, status: d.status, statusText: d.statusText },
      },
    };
    localStorage.setItem("bc-ratings", JSON.stringify(ratings));
    this.setState({ ratings, rateOpen: false, buddy: true });
    clearTimeout(this.bt);
    this.bt = setTimeout(() => this.setState({ buddy: false }), 3400);
  };

  cups(n: number, onPick?: (i: number) => void) {
    return [1, 2, 3, 4, 5].map((i) => ({
      key: i,
      color: i <= n ? "var(--accent)" : "var(--travertine-300)",
      onClick: onPick ? () => onPick(i) : undefined,
    }));
  }

  fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  }

  render() {
    const s = this.state;
    if (!s.mounted) return <div style={{ position: "fixed", inset: 0, background: "var(--bg-app)" }} />;
    const line = LINES[s.step];
    const typing = s.chars < line.t.length;
    const last = s.step === LINES.length - 1;
    const mood = typing ? (Math.floor(s.chars / 5) % 2 ? "talking" : line.m) : line.m;
    const ratingsArr = Object.values(s.ratings).sort((a, b) => b.date.localeCompare(a.date));
    const d = this.current();
    const dr = d ? s.ratings[d.id] : null;
    const u = s.user ? this.pt(s.user.lat, s.user.lng) : { left: "-200px", top: "-200px" };
    const srcLabel = ({ live: "Recién buscados", cache: "Guardados en tu teléfono", demo: "Ejemplo · Roma", offline: "Sin conexión" } as Record<string, string>)[s.source] || "";

    const tabOptions: SegmentedOption[] = [
      { value: "Cerca", label: "Cerca" },
      { value: "Mis", label: "Mis cafés · " + ratingsArr.length },
    ];

    const pins = s.shops.map((x) => {
      const p = this.pt(x.lat, x.lng);
      const active = x.id === s.activeId;
      const r = s.ratings[x.id];
      return { ...x, ...p, z: active ? 3 : 1, active, label: active ? x.distance : r ? r.score + "/5" : undefined, onClick: () => this.select(x.id) };
    });

    const nearby = s.shops.map((x) => ({
      ...x,
      my: s.ratings[x.id] ? s.ratings[x.id].score : undefined,
      selected: x.id === s.activeId,
      onClick: () => this.select(x.id),
    }));

    const mine: MineEntry[] = ratingsArr.map((r) => ({
      id: r.shop.id,
      area: r.shop.area,
      date: this.fmtDate(r.date),
      name: r.shop.name,
      cups: this.cups(r.score),
      hasNote: !!r.note,
      note: r.note,
      onClick: () => this.select(r.shop.id),
    }));

    const showList = s.stage === "app" && !d;
    const showDetail = !!d;
    const dArea = d ? (d.area ? d.area + " · " : "") + ("distance" in d ? d.distance : "") : "";
    const dCups = dr ? this.cups(dr.score) : [];
    const rateCups = this.cups(s.draftScore, (i) => this.setState({ draftScore: i }));
    const rateWord = ["Toca una taza", "Mejor ni ir", "Meh", "Cumple", "Muy bueno", "De los mejores"][s.draftScore];

    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "var(--bg-app)" }}>
        {s.stage === "onboarding" && (
          <div
            onClick={this.advance}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "44px 14px 24px", boxSizing: "border-box", cursor: "pointer", userSelect: "none", background: "var(--travertine-50)" }}
          >
            <div style={{ position: "relative", flex: 1, minHeight: 0, borderRadius: "var(--radius-arch)", background: "var(--terracotta-100)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
              <SkipButton onClick={this.skip}>Saltar intro</SkipButton>
              <div style={{ position: "absolute", left: "50%", bottom: 58, width: 200, height: 18, transform: "translateX(-50%)", borderRadius: "50%", background: "var(--terracotta-300)", opacity: 0.45 }} />
              <div style={{ position: "relative", marginBottom: 52 }}>{sprite(mood, 400)}</div>
            </div>
            <div style={{ position: "relative", margin: "-40px 6px 0", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", padding: "18px 18px 14px", minHeight: 150, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: -9, left: "50%", width: 16, height: 16, background: "var(--surface-card)", borderLeft: "1px solid var(--border-subtle)", borderTop: "1px solid var(--border-subtle)", transform: "translateX(-50%) rotate(45deg)" }} />
              <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Damián</div>
              <div style={{ flex: 1, font: "500 18px/1.45 var(--font-sans)", color: "var(--text-strong)", textWrap: "pretty" }}>
                {line.t.slice(0, s.chars)}
                <span style={{ display: "inline-block", width: 8, height: 16, marginLeft: 2, verticalAlign: -2, background: "var(--accent)", animation: "bc-blink 1s steps(1) infinite" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {LINES.map((_, i) => (
                    <div key={i} style={{ width: i === s.step ? 18 : 6, height: 6, borderRadius: 3, background: i <= s.step ? "var(--accent)" : "var(--travertine-300)", transition: "all var(--dur-base) var(--ease-out)" }} />
                  ))}
                </div>
                <div style={{ font: "var(--type-data)", fontSize: 12, color: "var(--text-muted)" }}>{typing ? "toca para completar" : last ? "" : "toca para seguir"}</div>
              </div>
            </div>
            {last && !typing && (
              <div style={{ marginTop: 14, display: "grid" }}>
                <Button size="lg" fullWidth icon="coffee" onClick={this.finishOnb}>
                  Vamos por café
                </Button>
              </div>
            )}
          </div>
        )}

        {s.stage === "permission" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "72px 24px 32px", boxSizing: "border-box", background: "var(--travertine-50)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: 132, height: 170, borderRadius: "var(--radius-arch)", background: "var(--accent-soft)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", marginBottom: 24 }}>
                <div style={{ marginBottom: -4 }}>{sprite("smile", 160)}</div>
              </div>
              <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--accent)", marginBottom: 10 }}>Un permiso</div>
              <div style={{ font: "var(--type-h2)", color: "var(--text-strong)", marginBottom: 12, textWrap: "balance" }}>¿Dónde estás hoy?</div>
              <div style={{ font: "var(--type-body)", color: "var(--text-body)", maxWidth: 300, textWrap: "pretty" }}>
                Uso tu ubicación una vez por visita para buscar los cafés cercanos. La lista se guarda en tu teléfono para no gastar datos.
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <Button size="lg" fullWidth icon="navigation" onClick={() => this.locate(false)}>
                Usar mi ubicación
              </Button>
              <Button variant="ghost" fullWidth onClick={() => this.locate(true)}>
                Ver ejemplo en Roma
              </Button>
            </div>
          </div>
        )}

        {s.stage === "app" && (
          <div style={{ position: "absolute", inset: 0 }}>
            <div ref={this.mapEl} style={{ position: "absolute", inset: 0, filter: "sepia(.32) saturate(.85) hue-rotate(-6deg) brightness(1.02)" }} />
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 500, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: u.left, top: u.top, transform: "translate(-50%,-50%)" }}>
                <UserLocation heading={30} />
              </div>
              {pins.map((p) => (
                <div key={p.id} style={{ position: "absolute", left: p.left, top: p.top, zIndex: p.z, transform: "translate(-50%,-100%)", pointerEvents: "auto" }}>
                  <MapPin active={p.active} status={p.status} label={p.label} onClick={p.onClick} />
                </div>
              ))}
            </div>

            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 600, padding: "52px 14px 0", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0, height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 8px 0 18px", borderRadius: "var(--radius-pill)", background: "var(--surface-raised)", boxShadow: "var(--shadow-md)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "400 20px/1.1 var(--font-display)", color: "var(--text-strong)", whiteSpace: "nowrap" }}>Cafés para Barbie</div>
                  <div style={{ font: "var(--type-data)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.loading ? "Buscando…" : s.shops.length + " cafés"} · {srcLabel}
                  </div>
                </div>
                <IconButton icon="refresh-cw" variant="plain" size={40} label="Buscar de nuevo" onClick={() => this.locate(s.source === "demo", true)} />
              </div>
            </div>

            {showList && (
              <>
                <div style={{ position: "absolute", right: 14, bottom: "calc(52% + 14px)", zIndex: 650, transform: `translateY(${s.sheetY}px)`, transition: s.dragging ? "none" : "transform var(--dur-base) var(--ease-out)" }}>
                  <IconButton
                    icon="locate-fixed"
                    label="Centrar en mí"
                    onClick={() => {
                      this.setState({ activeId: null });
                      if (this.map && s.user) this.map.flyTo([s.user.lat, s.user.lng], 16, { duration: 0.4 });
                    }}
                  />
                </div>
                <div
                  ref={this.sheetEl}
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "52%", zIndex: 700, display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", boxShadow: "var(--shadow-lg)", overflow: "hidden", transform: `translateY(${s.sheetY}px)`, transition: s.dragging ? "none" : "transform var(--dur-base) var(--ease-out)" }}
                >
                  <div
                    onPointerDown={this.sheetDown}
                    onPointerMove={this.sheetMove}
                    onPointerUp={this.sheetUp}
                    onPointerCancel={this.sheetUp}
                    role="button"
                    tabIndex={0}
                    aria-label={s.sheetY > 0 ? "Abrir lista de cafés" : "Abatir lista de cafés"}
                    aria-expanded={s.sheetY === 0}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") this.setState({ sheetY: this.sheetMax(), dragging: false });
                      if (e.key === "ArrowUp") this.setState({ sheetY: 0, dragging: false });
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this.setState((st) => ({ sheetY: st.sheetY > 0 ? 0 : this.sheetMax(), dragging: false }));
                      }
                    }}
                    style={{ display: "flex", justifyContent: "center", padding: "14px 0 10px", flexShrink: 0, cursor: "grab", touchAction: "none" }}
                  >
                    <div style={{ width: "var(--sheet-handle)", height: 5, borderRadius: 3, background: "var(--travertine-300)" }} />
                  </div>
                  <div style={{ padding: "4px 16px 12px" }}>
                    <SegmentedControl options={tabOptions} value={s.tab} onChange={(t) => this.setState({ tab: t as "Cerca" | "Mis" })} />
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 24px" }}>
                    {s.tab === "Cerca" && (
                      <>
                        {s.loading && <div style={{ padding: "32px 0", textAlign: "center", font: "var(--type-body-sm)", color: "var(--text-muted)" }}>Buscando cafés cerca de ti…</div>}
                        {!s.loading && s.shops.length === 0 && (
                          <div style={{ padding: "32px 8px", textAlign: "center", font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{s.source === "offline" ? "No pude buscar cafés sin conexión. Mantengo tu ubicación; intenta de nuevo cuando vuelva la red." : "No encontré cafés en este radio. Prueba a buscar de nuevo desde otra calle."}</div>
                        )}
                        <div style={{ display: "grid", gap: 10 }}>
                          {nearby.map((shop) => (
                            <ShopCard
                              key={shop.id}
                              name={shop.name}
                              neighborhood={shop.area}
                              distance={shop.distance}
                              walk={shop.walk}
                              rating={shop.my}
                              status={shop.status}
                              statusText={shop.statusText}
                              selected={shop.selected}
                              onClick={shop.onClick}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {s.tab === "Mis" && (
                      <>
                        {mine.length === 0 && (
                          <div style={{ padding: "28px 12px", textAlign: "center" }}>
                            <div style={{ font: "var(--type-h3)", color: "var(--text-strong)", marginBottom: 6 }}>Aún no calificas ninguno</div>
                            <div style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", textWrap: "pretty" }}>
                              Abre un café, pruébalo y toca Calificar. Tus opiniones se quedan aquí, aunque cambies de ciudad.
                            </div>
                          </div>
                        )}
                        <div style={{ display: "grid", gap: 10 }}>
                          {mine.map((r) => (
                            <MisRow key={r.id} r={r} />
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => { this.setState({ step: 0 }, () => this.startTyping()); this.go("onboarding"); }}>
                            Ver la intro otra vez
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {showDetail && d && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "72%", zIndex: 700, display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
                  <div style={{ width: "var(--sheet-handle)", height: 5, borderRadius: 3, background: "var(--travertine-300)" }} />
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
                  <div style={{ margin: "0 0 14px" }}>
                    <IconButton icon="arrow-left" variant="outline" size={40} label="Volver" onClick={() => this.setState({ activeId: null, rateOpen: false })} />
                  </div>
                  <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--accent)" }}>{dArea}</div>
                  <div style={{ font: "var(--type-h2)", color: "var(--text-strong)", margin: "6px 0 10px", textWrap: "balance" }}>{d.name}</div>
                  <StatusBadge status={d.status}>{d.statusText}</StatusBadge>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, margin: "18px 0" }}>
                    <Button size="lg" icon="navigation" onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=" + d.lat + "," + d.lng + "&travelmode=walking", "_blank")}>
                      Cómo llegar · {"walk" in d ? d.walk : ""}
                    </Button>
                    <Button size="lg" variant="secondary" icon="coffee" onClick={this.openRate}>
                      {dr ? "Editar" : "Calificar"}
                    </Button>
                  </div>
                  {dr && (
                    <div style={{ display: "grid", gap: 8, padding: "14px 16px", marginBottom: 16, borderRadius: "var(--radius-lg)", background: "var(--accent-soft)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--accent)" }}>Tu opinión</div>
                        <div style={{ font: "var(--type-data)", fontSize: 12, color: "var(--text-muted)" }}>{this.fmtDate(dr.date)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {dCups.map((c) => (
                          <Icon key={c.key} name="coffee" size={20} color={c.color} />
                        ))}
                      </div>
                      {dr.note && <div style={{ font: "var(--type-quote)", fontSize: 17, color: "var(--text-body)", textWrap: "pretty" }}>&ldquo;{dr.note}&rdquo;</div>}
                    </div>
                  )}
                  {d.addr && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-subtle)", font: "var(--type-body-sm)", color: "var(--text-body)" }}>
                      <Icon name="map-pin" size={18} color="var(--text-muted)" />
                      <span style={{ flex: 1 }}>{d.addr}</span>
                      <span style={{ font: "var(--type-data)" }}>{"distance" in d ? d.distance : ""}</span>
                    </div>
                  )}
                  {d.hours && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-subtle)" }}>
                      <Icon name="clock" size={18} color="var(--text-muted)" />
                      <span style={{ flex: 1, font: "var(--type-data)", color: "var(--text-body)", lineHeight: 1.6 }}>{d.hours}</span>
                    </div>
                  )}
                  {d.phone && (
                    <div onClick={() => window.open("tel:" + d.phone.replace(/\s/g, ""))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                      <Icon name="phone" size={18} color="var(--text-muted)" />
                      <span style={{ flex: 1, font: "var(--type-data)", color: "var(--accent)" }}>{d.phone}</span>
                    </div>
                  )}
                  {d.web && (
                    <div onClick={() => window.open(d.web, "_blank")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border-subtle)", cursor: "pointer" }}>
                      <Icon name="globe" size={18} color="var(--text-muted)" />
                      <span style={{ flex: 1, font: "var(--type-body-sm)", color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.web}</span>
                    </div>
                  )}
                  {d.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                      {d.tags.map((t, i) => (
                        <FilterChip key={i} label={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {s.rateOpen && d && (
              <div style={{ position: "absolute", inset: 0, zIndex: 800, background: "var(--surface-scrim)", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", background: "var(--surface-card)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", boxShadow: "var(--shadow-lg)", padding: "22px 20px 28px", boxSizing: "border-box", display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ font: "var(--type-eyebrow)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>¿Qué tal estuvo?</div>
                      <div style={{ font: "var(--type-h3)", color: "var(--text-strong)" }}>{d.name}</div>
                    </div>
                    <IconButton icon="x" variant="plain" size={40} label="Cerrar" onClick={() => this.setState({ rateOpen: false })} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {rateCups.map((c) => (
                      <CupButton key={c.key} color={c.color} onClick={c.onClick} />
                    ))}
                    <div style={{ marginLeft: 8, font: "var(--type-data)", color: "var(--text-muted)" }}>{rateWord}</div>
                  </div>
                  <NoteTextarea value={s.draftNote} onChange={(e) => this.setState({ draftNote: e.target.value })} />
                  <Button size="lg" fullWidth disabled={!s.draftScore} onClick={this.saveRate}>
                    Guardar opinión
                  </Button>
                </div>
              </div>
            )}

            {s.buddy && (
              <div style={{ position: "absolute", left: 14, right: 14, bottom: "calc(72% + 2px)", zIndex: 750, display: "flex", alignItems: "flex-end", gap: 6, pointerEvents: "none", animation: "bc-pop var(--dur-slow) var(--ease-out)" }}>
                <div>{sprite("happy", 92)}</div>
                <div style={{ marginBottom: 30, padding: "10px 14px", borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px", background: "var(--surface-card)", boxShadow: "var(--shadow-md)", font: "500 15px/1.35 var(--font-sans)", color: "var(--text-strong)", maxWidth: 190 }}>
                  Anotado. Luego me cuentas qué tal.
                </div>
              </div>
            )}

            {s.toast && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 118, zIndex: 850, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                <Toast icon={s.toast.icon} message={s.toast.t} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
