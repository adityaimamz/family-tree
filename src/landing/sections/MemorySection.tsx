import { motion } from "framer-motion";
import { Camera, MapPin, MessageSquareQuote, NotebookPen } from "lucide-react";

const memoryDetails = [
  { icon: Camera, label: "Old photos", text: "Who stood beside the mango tree in 1987" },
  { icon: NotebookPen, label: "Nicknames", text: "Why everyone called her Ibu Lina" },
  { icon: MapPin, label: "Family moves", text: "The year the Rahman branch settled in Jakarta" },
];

export default function MemorySection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-surface lg:py-32">
      <div className="absolute inset-0 bg-archive-texture opacity-14 [mask-image:linear-gradient(90deg,rgba(0,0,0,0.86),transparent_88%)]" />
      <div className="absolute -right-28 top-20 h-80 w-80 rounded-full bg-sage/18 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-full bg-[linear-gradient(180deg,transparent,hsl(var(--dark-green)_/_0.72))]" />

      <div className="relative mx-auto grid w-full max-w-[1320px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(420px,0.7fr)_minmax(0,0.92fr)] lg:items-end xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.72, ease: [0.32, 0.72, 0, 1] }}
          className="order-1 lg:order-2"
        >
          <p className="text-sm font-semibold leading-6 text-surface/72">
            Memory lives with people before it becomes a record.
          </p>
          <h2 className="mt-6 max-w-[980px] text-balance font-body text-4xl font-semibold leading-[1.02] text-surface sm:text-5xl lg:text-[68px]">
            Every family has someone who still remembers.
          </h2>
          <p className="mt-8 max-w-[70ch] text-xl leading-9 text-surface/76">
            The aunt who knows every nickname. The cousin who can point to the old reunion photo and name the room, the
            year, the joke, and the people who came from far away. WarisanAI gives those memories somewhere private to
            land while relatives can still tell the story in their own words.
          </p>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 34, rotate: 1.2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="order-2 rounded-[2.25rem] border border-surface/18 bg-surface/[0.08] p-1.5 shadow-[0_34px_90px_-62px_rgba(0,0,0,0.72)] lg:order-1"
        >
          <div className="rounded-[calc(2.25rem-0.375rem)] border border-surface/14 bg-surface/[0.08] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] sm:p-7">
            <MessageSquareQuote className="h-8 w-8 text-accent" strokeWidth={1.7} />
            <p className="mt-6 text-2xl font-medium leading-10 text-surface">
              "Ask your uncle about the house in Kotagede. He remembers why everyone gathered there after the move."
            </p>
            <p className="mt-5 text-sm font-medium leading-6 text-surface/62">
              A reminder from the Rahman family archive
            </p>
          </div>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.62, delay: 0.12, ease: [0.32, 0.72, 0, 1] }}
          className="order-3 lg:col-span-2"
        >
          <div className="grid gap-3 border-t border-surface/14 pt-8 md:grid-cols-3">
            {memoryDetails.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <motion.div
                  key={detail.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.48 }}
                  className="flex gap-4 rounded-[1.45rem] bg-surface/[0.07] p-4 text-surface"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface/12 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{detail.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-surface/66">{detail.text}</span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
