import { ArrowLeftRight, MessageCircle, Search } from "lucide-react";

const STEPS = [
  {
    step: "01 / 03",
    title: "Busca y filtra",
    description: "Por zona, precio, modalidad y amenidades. Sin registro.",
    Icon: Search,
  },
  {
    step: "02 / 03",
    title: "Compara lado a lado",
    description: "Precios, horarios y servicios de varios centros a la vez.",
    Icon: ArrowLeftRight,
  },
  {
    step: "03 / 03",
    title: "Contacta por WhatsApp",
    description: "Escríbele directo al gimnasio. Sin intermediarios ni comisiones.",
    Icon: MessageCircle,
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="mt-10 px-1 md:px-4">
      <p className="text-xs font-medium uppercase tracking-widest text-quegym-highlight">
        Proceso
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-quegym-primary md:text-3xl">
        Cómo funciona QueGym
      </h2>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {STEPS.map((item) => (
          <article
            key={item.step}
            className="qg-surface qg-motion relative rounded-2xl border border-quegym-border bg-quegym-elevated p-5"
          >
            <span className="absolute right-4 top-4 text-xs text-quegym-secondary">
              {item.step}
            </span>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-quegym-highlight/40 bg-quegym-highlight-soft">
              <item.Icon className="h-5 w-5 text-quegym-highlight" aria-hidden />
            </div>
            <h3 className="font-semibold text-quegym-primary">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-quegym-secondary">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
