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
    <div className="flex items-center gap-4 overflow-x-auto border-b border-quegym-border pb-0 text-xs">
      {sections.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={
            activeId === item.id
              ? "shrink-0 border-b-2 border-quegym-highlight pb-2 font-semibold text-quegym-highlight"
              : "shrink-0 pb-2 text-quegym-secondary hover:text-quegym-primary"
          }
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
