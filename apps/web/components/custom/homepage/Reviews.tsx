"use client";

import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { AuroraText } from "@/components/magicui/aurora-text";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Sofia Mehra",
    username: "@sofiam",
    body: "Drachma makes trading feel like a game, but with real financial insight. So fun!",
    img: "https://avatar.vercel.sh/sofiam",
  },
  {
    name: "Karan Patel",
    username: "@karanp",
    body: "I’ve finally understood how the market works without risking a rupee. Love it.",
    img: "https://avatar.vercel.sh/karanp",
  },
  {
    name: "Priya Roy",
    username: "@priyar",
    body: "The leaderboard keeps me motivated to learn and try new strategies daily.",
    img: "https://avatar.vercel.sh/priyar",
  },
  {
    name: "Aarav Singh",
    username: "@aaravs",
    body: "Drachma feels like fantasy football for finance. Really well built!",
    img: "https://avatar.vercel.sh/aaravs",
  },
  {
    name: "Tanya Das",
    username: "@tanyad",
    body: "The virtual trading interface is smooth and very realistic. 10/10 experience.",
    img: "https://avatar.vercel.sh/tanyad",
  },
  {
    name: "Ravi Nair",
    username: "@ravin",
    body: "I used Drachma to test my investment ideas. It’s like my finance lab.",
    img: "https://avatar.vercel.sh/ravin",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4 transition-colors duration-200",
        "border-white/10 bg-white/5 hover:bg-white/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <img
          className="rounded-full border border-white/20"
          width="32"
          height="32"
          alt={`${name} avatar`}
          src={img}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-semibold text-white">
            {name}
          </figcaption>
          <p className="text-xs text-white/60">{username}</p>
        </div>
      </div>
      <blockquote className="mt-3 text-sm text-white/80 leading-relaxed">
        {body}
      </blockquote>
    </motion.figure>
  );
};

export default function Reviews() {
  return (
    <motion.section
      id="reviews"
      className="relative w-full py-16 bg-gradient-to-b from-[#0a0a1f] to-[#1a103c]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="text-center mb-10">
        <motion.h2
          className="text-2xl md:text-4xl font-extrabold text-white"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <AuroraText>What Drachma Users Are Saying</AuroraText>
        </motion.h2>
        <motion.p
          className="text-white/60 text-sm mt-2"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Reviews from traders and learners across the country.
        </motion.p>
      </div>

      <motion.div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <Marquee pauseOnHover className="[--duration:25s]">
          {firstRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:25s]">
          {secondRow.map((review) => (
            <ReviewCard key={review.username} {...review} />
          ))}
        </Marquee>

        {/* gradient edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0a0a1f]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#1a103c]" />
      </motion.div>
    </motion.section>
  );
}
