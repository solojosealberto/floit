"use client";

import { useEffect, useMemo, useState } from "react";

type Section = {
  id: string;
  label: string;
};

type Props = {
  sections: Section[];
};

export function GymMobileSectionTabs({ sections }: Props) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const onScroll = () => {
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= 120) current = id;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds]);

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 pb-2 text-xs text-neutral-500">
      {sections.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={
            activeId === item.id
              ? "font-semibold text-neutral-800"
              : "hover:text-neutral-700"
          }
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
