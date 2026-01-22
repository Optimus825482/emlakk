// Mahalle sınırları - Gerçek koordinatlara yakın polygon'lar

export interface NeighborhoodBoundary {
  name: string;
  district: string;
  bounds: [number, number][]; // [lat, lng] polygon köşeleri
  center: { lat: number; lng: number };
}

// Akyazı merkez mahalleleri (gerçek koordinatlara yakın)
export const AKYAZI_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  {
    name: "Ömercikler Mh.",
    district: "Akyazı",
    center: { lat: 40.6892, lng: 30.6289 },
    bounds: [
      [40.695, 30.62],
      [40.695, 30.638],
      [40.683, 30.638],
      [40.683, 30.62],
    ],
  },
  {
    name: "İnönü Mh.",
    district: "Akyazı",
    center: { lat: 40.6825, lng: 30.6195 },
    bounds: [
      [40.688, 30.611],
      [40.688, 30.628],
      [40.677, 30.628],
      [40.677, 30.611],
    ],
  },
  {
    name: "Yeni Mah.",
    district: "Akyazı",
    center: { lat: 40.6915, lng: 30.6325 },
    bounds: [
      [40.697, 30.624],
      [40.697, 30.641],
      [40.686, 30.641],
      [40.686, 30.624],
    ],
  },
  {
    name: "Yunus Emre Mah.",
    district: "Akyazı",
    center: { lat: 40.6795, lng: 30.6305 },
    bounds: [
      [40.685, 30.622],
      [40.685, 30.639],
      [40.674, 30.639],
      [40.674, 30.622],
    ],
  },
  {
    name: "Fatih Mah.",
    district: "Akyazı",
    center: { lat: 40.6835, lng: 30.6145 },
    bounds: [
      [40.689, 30.606],
      [40.689, 30.623],
      [40.678, 30.623],
      [40.678, 30.606],
    ],
  },
  {
    name: "Cumhuriyet Mah.",
    district: "Akyazı",
    center: { lat: 40.6865, lng: 30.6245 },
    bounds: [
      [40.692, 30.616],
      [40.692, 30.633],
      [40.681, 30.633],
      [40.681, 30.616],
    ],
  },
  {
    name: "Gazi Süleyman Paşa Mh.",
    district: "Akyazı",
    center: { lat: 40.6785, lng: 30.6265 },
    bounds: [
      [40.684, 30.618],
      [40.684, 30.635],
      [40.673, 30.635],
      [40.673, 30.618],
    ],
  },
  {
    name: "Hastahane Mah.",
    district: "Akyazı",
    center: { lat: 40.6845, lng: 30.6275 },
    bounds: [
      [40.69, 30.619],
      [40.69, 30.636],
      [40.679, 30.636],
      [40.679, 30.619],
    ],
  },
  {
    name: "Konuralp Mah.",
    district: "Akyazı",
    center: { lat: 40.6805, lng: 30.6225 },
    bounds: [
      [40.686, 30.614],
      [40.686, 30.631],
      [40.675, 30.631],
      [40.675, 30.614],
    ],
  },
];

// Kuzuluk (Akyazı'nın kuzeyinde)
export const KUZULUK_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  {
    name: "Kuzuluk Ortamahalle Mh.",
    district: "Akyazı",
    center: { lat: 40.7245, lng: 30.5825 },
    bounds: [
      [40.73, 30.574],
      [40.73, 30.591],
      [40.719, 30.591],
      [40.719, 30.574],
    ],
  },
  {
    name: "Kuzuluk Topçusırtı Mh.",
    district: "Akyazı",
    center: { lat: 40.7215, lng: 30.5865 },
    bounds: [
      [40.727, 30.578],
      [40.727, 30.595],
      [40.716, 30.595],
      [40.716, 30.578],
    ],
  },
  {
    name: "Kuzuluk Şose Mh.",
    district: "Akyazı",
    center: { lat: 40.7275, lng: 30.5785 },
    bounds: [
      [40.733, 30.57],
      [40.733, 30.587],
      [40.722, 30.587],
      [40.722, 30.57],
    ],
  },
];

// Altındere (Akyazı'nın güneyinde)
export const ALTINDERE_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  {
    name: "Altındere Cumhuriyet Mh.",
    district: "Akyazı",
    center: { lat: 40.6425, lng: 30.6185 },
    bounds: [
      [40.648, 30.61],
      [40.648, 30.627],
      [40.637, 30.627],
      [40.637, 30.61],
    ],
  },
  {
    name: "Altındere Gündoğan Mh.",
    district: "Akyazı",
    center: { lat: 40.6395, lng: 30.6225 },
    bounds: [
      [40.645, 30.614],
      [40.645, 30.631],
      [40.634, 30.631],
      [40.634, 30.614],
    ],
  },
];

// Küçücek (Akyazı'nın batısında)
export const KUCUCEK_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  {
    name: "Küçücek İstiklal Mh.",
    district: "Akyazı",
    center: { lat: 40.6685, lng: 30.5625 },
    bounds: [
      [40.674, 30.554],
      [40.674, 30.571],
      [40.663, 30.571],
      [40.663, 30.554],
    ],
  },
  {
    name: "Küçücek Cumhuriyet Mh.",
    district: "Akyazı",
    center: { lat: 40.6655, lng: 30.5665 },
    bounds: [
      [40.671, 30.558],
      [40.671, 30.575],
      [40.66, 30.575],
      [40.66, 30.558],
    ],
  },
];

// Dokurcun (Akyazı'nın doğusunda)
export const DOKURCUN_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  {
    name: "Dokurcun Mh.",
    district: "Akyazı",
    center: { lat: 40.6945, lng: 30.6825 },
    bounds: [
      [40.7, 30.674],
      [40.7, 30.691],
      [40.689, 30.691],
      [40.689, 30.674],
    ],
  },
  {
    name: "Haydarlar Mh.",
    district: "Akyazı",
    center: { lat: 40.6915, lng: 30.6865 },
    bounds: [
      [40.697, 30.678],
      [40.697, 30.695],
      [40.686, 30.695],
      [40.686, 30.678],
    ],
  },
  {
    name: "Dokurcun Çaylar Yeni Mh.",
    district: "Akyazı",
    center: { lat: 40.6885, lng: 30.6905 },
    bounds: [
      [40.694, 30.682],
      [40.694, 30.699],
      [40.683, 30.699],
      [40.683, 30.682],
    ],
  },
];

// Tüm mahalleleri birleştir
export const ALL_NEIGHBORHOODS: NeighborhoodBoundary[] = [
  ...AKYAZI_NEIGHBORHOODS,
  ...KUZULUK_NEIGHBORHOODS,
  ...ALTINDERE_NEIGHBORHOODS,
  ...KUCUCEK_NEIGHBORHOODS,
  ...DOKURCUN_NEIGHBORHOODS,
];

// Mahalle isminden boundary bul
export function getNeighborhoodBoundary(
  neighborhoodName: string,
  district: string,
): NeighborhoodBoundary | null {
  const normalized = neighborhoodName.toLowerCase().trim();

  return (
    ALL_NEIGHBORHOODS.find(
      (nb) =>
        nb.district.toLowerCase() === district.toLowerCase() &&
        nb.name.toLowerCase().includes(normalized),
    ) || null
  );
}

// Polygon içinde random koordinat üret
export function generateCoordinateInBounds(
  bounds: [number, number][],
  seed: number,
): { lat: number; lng: number } {
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const lats = bounds.map((b) => b[0]);
  const lngs = bounds.map((b) => b[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const lat = minLat + random(seed) * (maxLat - minLat);
  const lng = minLng + random(seed + 1) * (maxLng - minLng);

  return { lat, lng };
}
