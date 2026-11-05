import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function VehicleGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const total = images.length;

  const step = (delta: number) => setActive((i) => (i + delta + total) % total);

  return (
    <div>
      <div className="glass relative overflow-hidden rounded-3xl p-2">
        <img
          src={images[active] ?? "/placeholder-vehicle.svg"}
          alt={`${alt} — image ${active + 1} of ${total}`}
          width={1024}
          height={640}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/placeholder-vehicle.svg";
          }}
          className="aspect-[16/10] w-full rounded-2xl object-cover"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="icon-btn absolute top-1/2 left-4 size-10 -translate-y-1/2"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="icon-btn absolute top-1/2 right-4 size-10 -translate-y-1/2"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-brand/70 px-3 py-1 text-xs font-medium text-mist">
              {active + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1}`}
              className={`overflow-hidden rounded-xl transition ${
                index === active ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                width={512}
                height={320}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/placeholder-vehicle.svg";
                }}
                className="aspect-[3/2] w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
