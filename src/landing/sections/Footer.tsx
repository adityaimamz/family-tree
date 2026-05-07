import { footerLinks } from "../lib/data/sections";

export default function Footer() {
  return (
    <footer className="bg-bg-alt border-t border-stroke py-16 px-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10 max-w-[1200px] mx-auto">
        <div className="col-span-2 md:col-span-2 space-y-4">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block mr-2" />
            <span className="font-body font-bold text-primary text-xl tracking-tight">WarisanAI</span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed max-w-[280px]">
            Private by default. Built for families. Bring your stories, photos, and messy family history together.
          </p>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title} className="col-span-1">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-ink mb-4">{group.title}</h5>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-[13px] text-ink-secondary hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-stroke mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-[1200px] mx-auto text-[13px] text-ink-muted">
        <p>&copy; 2026 WarisanAI. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          Made with <span className="text-accent">♥</span> for families everywhere
        </p>
      </div>
    </footer>
  );
}
