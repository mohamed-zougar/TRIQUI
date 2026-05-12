import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Package,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";

const STEPS = [
  {
    icon: Package,
    title: "Post what you need",
    description:
      "Clients describe a package, route, and timeline. Shippers publish trips with their available capacity.",
  },
  {
    icon: Route,
    title: "Match by route",
    description:
      "We surface trips and requests that share an origin and destination so the right people see each other first.",
  },
  {
    icon: Truck,
    title: "Connect and deliver",
    description:
      "Reach out directly by phone, agree on the details, and complete the delivery without intermediaries.",
  },
];

const VALUE_PROPS = [
  {
    icon: MapPin,
    title: "All 69 wilayas",
    description: "Coverage across Algeria — from coastal cities to the deep south.",
  },
  {
    icon: ShieldCheck,
    title: "Verified accounts",
    description: "Every account is verified by email so you know who you are working with.",
  },
  {
    icon: Truck,
    title: "Individuals and enterprises",
    description: "Built for occasional drivers and freight companies alike.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Mobile-only design (exact replica of page.js) */}
      <div className="flex min-h-screen flex-col bg-white px-6 pt-10 pb-8 w-full sm:hidden">
        <div className="flex-1 flex flex-col items-center justify-center -mt-10">
          <h1 className="text-6xl font-black tracking-tight mb-4">
            <span className="text-[#e8172c]">Tri</span>
            <span className="text-black">QI+</span>
          </h1>

          <p className="text-center text-gray-500 font-medium px-4 text-lg/snug">
            Smarter routes. Secure your deliveries.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4 pb-6">
          <Link href="/login" className="w-full">
            <button className="w-full h-12 rounded-xl text-sm font-bold bg-[#e8172c] text-white hover:opacity-90 transition-opacity">
              Login
            </button>
          </Link>

          <Link href="/signup" className="w-full">
            <button className="w-full h-12 rounded-xl text-sm font-bold border-2 border-[#e8172c] text-[#e8172c] hover:bg-rose-50 transition-colors">
              Sign Up
            </button>
          </Link>

          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-gray-800 hover:text-[#e8172c] transition-colors"
            >
              Request a New Password
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop design (Original page.tsx style) */}
      <div className="hidden sm:block bg-[var(--color-surface-muted)]">
        <header className="border-b border-[var(--color-border)] bg-white/80 backdrop-blur">
          <div className="container-app flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              <span className="text-[var(--color-brand-500)]">Tri</span>QI+
            </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-xl bg-[var(--color-brand-500)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="container-app pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-500)]" />
            Freight matching for Algeria
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-[var(--color-fg-primary)] sm:text-5xl lg:text-6xl">
            Move goods the smart way.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-fg-secondary)] sm:text-lg">
            TriQI+ connects clients who need to ship goods with shippers who already have
            capacity along their route. Post a request, browse trips, complete deliveries —
            without intermediaries.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
            >
              Create an account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-xl border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-subtle)]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-white">
        <div className="container-app py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-600)]">
              How it works
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-fg-primary)] sm:text-3xl">
              Three steps from posting to delivery.
            </h2>
          </div>

          <ol className="mt-10 grid gap-6 lg:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand-600)]">
                    <Icon size={20} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                    Step {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-[var(--color-fg-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--color-fg-secondary)]">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="container-app py-14 lg:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_PROPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-fg-primary)]">
                  <Icon size={20} />
                </span>
                <h3 className="text-base font-semibold text-[var(--color-fg-primary)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-[var(--color-fg-secondary)]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-white">
        <div className="container-app py-14 lg:py-20">
          <div className="flex flex-col items-start gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg-primary)] sm:text-2xl">
                Ready to start?
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-fg-secondary)]">
                Create a free account to post your first request or trip in under a minute.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-brand-600)]"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] bg-white">
        <div className="container-app flex flex-col gap-3 py-6 text-sm text-[var(--color-fg-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} TriQI+</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-[var(--color-fg-primary)]">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-[var(--color-fg-primary)]">
              Create account
            </Link>
          </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
