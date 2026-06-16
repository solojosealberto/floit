import Link from "next/link";
import { QueGymLogo } from "@/components/quegym-logo";
import {
  BRAND_NAME,
  BRAND_PARTNER_CTA,
  BRAND_TAGLINE,
} from "@/lib/brand";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-quegym-border bg-quegym-page">
      <div className="mx-auto w-full max-w-[1280px] px-3 py-8 md:py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <QueGymLogo variant="horizontal" theme="auto" size="sm" href />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-quegym-secondary">
              {BRAND_TAGLINE} Compara gimnasios en Caracas y contacta directo por
              WhatsApp.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-quegym-secondary">
              Explorar
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/buscar" className="text-quegym-primary hover:text-quegym-highlight">
                  Buscar gimnasios
                </Link>
              </li>
              <li>
                <Link href="/comparar" className="text-quegym-primary hover:text-quegym-highlight">
                  Comparar centros
                </Link>
              </li>
              <li>
                <Link href="/favoritos" className="text-quegym-primary hover:text-quegym-highlight">
                  Mis favoritos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-quegym-secondary">
              Partners y legal
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/partner/claim"
                  className="text-quegym-primary hover:text-quegym-highlight"
                >
                  {BRAND_PARTNER_CTA}
                </Link>
              </li>
              <li>
                <Link
                  href="/partner/login"
                  className="text-quegym-primary hover:text-quegym-highlight"
                >
                  Acceso partners
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-quegym-primary hover:text-quegym-highlight"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-quegym-border pt-6 text-xs text-quegym-secondary">
          © {YEAR} {BRAND_NAME}. Información referencial; contacta al centro para
          confirmar precios y horarios.
        </p>
      </div>
    </footer>
  );
}
