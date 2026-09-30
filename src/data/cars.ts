export interface Car {
  id: string;
  manufacturer: string;
  model: string;
  generation: string;
  year: number;
  country: string;
  highlights: string[];
  study: "roadster" | "kei" | "coupe" | "hatch";
  paint: string;
  modelPath?: string;
  assetReady: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}

export interface ReadyCar extends Car {
  modelPath: string;
}

const heroCamera = {
  cameraPosition: [7.2, 3.2, 7.2] as [number, number, number],
  cameraTarget: [0, 0.65, 0] as [number, number, number],
  scale: 1,
  rotation: [0, Math.PI * 0.09, 0] as [number, number, number],
};

// Miata Vibe: small, analogue Japanese machines with a distinct character.
// Only entries with assetReady may be rendered. Planned cars intentionally have
// no fallback GLB so an unrelated vehicle is never misrepresented as one of them.
export const cars: Car[] = [
  { id: "miata-na", manufacturer: "MAZDA", model: "MX-5", generation: "NA · 1989", year: 1989, country: "JAPAN", highlights: ["LIGHTWEIGHT", "ROADSTER", "POP-UP LIGHTS"], study: "roadster", paint: "#9b1d20", modelPath: "/models/miata/car.glb", assetReady: true, ...heroCamera },
  { id: "honda-beat", manufacturer: "HONDA", model: "BEAT", generation: "PP1 · 1991", year: 1991, country: "JAPAN", highlights: ["656 CC", "MID-ENGINE", "KEI ROADSTER"], study: "kei", paint: "#e5d8c4", assetReady: false, ...heroCamera },
  { id: "suzuki-cappuccino", manufacturer: "SUZUKI", model: "CAPPUCCINO", generation: "EA11R · 1991", year: 1991, country: "JAPAN", highlights: ["KEI", "FRONT-MID", "FEATHERWEIGHT"], study: "kei", paint: "#365b68", assetReady: false, ...heroCamera },
  { id: "autozam-az-1", manufacturer: "AUTOZAM", model: "AZ-1", generation: "PG6SA · 1992", year: 1992, country: "JAPAN", highlights: ["KEI", "GULLWING", "MID-ENGINE"], study: "coupe", paint: "#d5bd45", assetReady: false, ...heroCamera },
  { id: "toyota-mr2-aw11", manufacturer: "TOYOTA", model: "MR2", generation: "AW11 · 1984", year: 1984, country: "JAPAN", highlights: ["MID-ENGINE", "WEDGE", "ANALOGUE"], study: "coupe", paint: "#efefec", assetReady: false, ...heroCamera },
  { id: "honda-crx", manufacturer: "HONDA", model: "CR-X", generation: "EF8 · 1989", year: 1989, country: "JAPAN", highlights: ["LIGHTWEIGHT", "VTEC", "HATCHBACK"], study: "hatch", paint: "#1c3c68", assetReady: false, ...heroCamera },
  { id: "toyota-ae86", manufacturer: "TOYOTA", model: "AE86", generation: "TRUENO · 1983", year: 1983, country: "JAPAN", highlights: ["RWD", "4A-GE", "COUPE"], study: "coupe", paint: "#f1eee6", modelPath: "/models/ae86.glb", assetReady: true, ...heroCamera },
  { id: "honda-civic-eg", manufacturer: "HONDA", model: "CIVIC", generation: "EG · 1992", year: 1992, country: "JAPAN", highlights: ["VTEC", "COMPACT", "CULT"], study: "hatch", paint: "#b9c3b5", assetReady: false, ...heroCamera },
  { id: "mazda-rx7-fc", manufacturer: "MAZDA", model: "RX-7", generation: "FC · 1985", year: 1985, country: "JAPAN", highlights: ["ROTARY", "POP-UP LIGHTS", "GRAND TOURER"], study: "coupe", paint: "#c7cbd1", assetReady: false, ...heroCamera },
  { id: "nissan-silvia-s13", manufacturer: "NISSAN", model: "SILVIA", generation: "S13 · 1988", year: 1988, country: "JAPAN", highlights: ["RWD", "COUPE", "BALANCED"], study: "coupe", paint: "#9c9a8e", assetReady: false, ...heroCamera },
];

export const availableCars: ReadyCar[] = cars.filter(
  (car): car is ReadyCar => car.assetReady && typeof car.modelPath === "string",
);
