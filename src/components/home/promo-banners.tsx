import Image from "next/image";
import Link from "next/link";
import { Countdown } from "./countdown";

export function PromoBanners() {
  return (
    <section className="bg-white py-10">
      <div className="container-page grid gap-3.5 lg:grid-cols-2">
        {/* ------------------------------------------------ semester rush */}
        <div className="relative flex min-h-[260px] items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 via-brand to-brand-700 p-7">
          <div className="relative z-10 min-w-0 sm:max-w-[55%]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">
              Semester rush
            </p>
            <h3 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[32px]">
              Up To 60% Off
              <br />
              Hostel Gear
            </h3>
            <div className="mt-5">
              <Countdown />
            </div>
            <Link
              href="/browse/hostel-room"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-5 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              Browse Deals
            </Link>
          </div>

          {/* product medallion — a circle keeps the photo's own backdrop from
              reading as a grey rectangle sitting on the orange */}
          <div className="pointer-events-none absolute right-6 top-1/2 hidden aspect-square w-[38%] max-w-[190px] -translate-y-1/2 sm:block">
            <div className="absolute inset-0 rounded-full bg-white/25" />
            <div className="absolute inset-[7%] overflow-hidden rounded-full shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]">
              <Image
                src="/images/c-fashion.jpg"
                alt=""
                fill
                sizes="200px"
                className="scale-105 object-cover"
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------- request board */}
        <div className="relative flex min-h-[260px] items-center overflow-hidden rounded-2xl bg-ink p-7">
          <div className="relative z-10 min-w-0 sm:max-w-[58%]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand">
              Request board
            </p>
            <h3 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-[32px]">
              Name Your
              <br />
              Own Price
            </h3>
            <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-white/65">
              Post what you need and let sellers bid for it. Award the one you
              like — everyone else is told the moment it closes.
            </p>
            <Link
              href="/requests/new"
              className="mt-6 inline-flex h-10 items-center rounded-lg border border-white/25 px-5 text-[13px] font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-ink"
            >
              Post a Request
            </Link>
          </div>

          <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[42%] sm:block">
            <Image
              src="/images/banner-model.jpg"
              alt=""
              fill
              sizes="300px"
              className="object-cover object-top opacity-90 [mask-image:linear-gradient(to_right,transparent,black_45%)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
