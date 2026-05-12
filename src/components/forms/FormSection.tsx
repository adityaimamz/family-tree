import type { ReactNode } from "react";

export const FormSection = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <section className="rounded-[1.25rem] border border-white/75 bg-surface/95 p-4 shadow-[0_22px_50px_-36px_rgba(80,54,30,0.82)] ring-1 ring-border-soft/60 sm:p-5 md:rounded-[2rem] md:p-7">
    <h2 className="text-lg font-extrabold tracking-tight text-text-primary sm:text-xl">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 md:gap-5">{children}</div>
  </section>
);
