import { VenueImage } from "@floit/ui";

type Props = {
  name: string;
  venueType?: string;
  modalities?: string[];
  photoUrls?: string[];
};

/** Galería adaptativa: oculta slots vacíos; fallback con iniciales. */
export function GymGallery({ name, venueType, modalities, photoUrls = [] }: Props) {
  const photos = photoUrls.filter(Boolean);
  const modality = modalities?.[0] ?? venueType ?? null;

  if (photos.length === 0) {
    return (
      <div id="galeria" className="scroll-mt-24">
        <VenueImage
          src={null}
          name={name}
          modality={modality}
          className="h-44 w-full rounded-2xl md:h-56"
        />
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div id="galeria" className="scroll-mt-24">
        <VenueImage
          src={photos[0]}
          name={name}
          modality={modality}
          className="h-44 w-full rounded-2xl md:h-56"
        />
      </div>
    );
  }

  return (
    <div id="galeria" className="grid scroll-mt-24 gap-2 md:grid-cols-[2fr_1fr]">
      <VenueImage
        src={photos[0]}
        name={name}
        modality={modality}
        className="h-44 w-full rounded-2xl md:h-56"
      />
      <div className="grid gap-2">
        {photos[1] ? (
          <VenueImage
            src={photos[1]}
            name={name}
            modality={modality}
            className="h-[108px] w-full rounded-2xl md:h-auto md:min-h-[108px]"
          />
        ) : null}
        {photos.length > 2 ? (
          <div className="flex h-[108px] items-center justify-center rounded-2xl bg-quegym-accent text-xs font-medium text-white">
            Ver {photos.length} fotos
          </div>
        ) : null}
      </div>
    </div>
  );
}
