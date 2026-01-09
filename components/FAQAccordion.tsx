"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl bg-white shadow-md transition-all">
          <button
            onClick={() => toggleIndex(index)}
            className="w-full flex justify-between items-center text-left px-6 py-4 focus:outline-none"
          >
            <span className="text-lg font-semibold text-gray-900">{item.question}</span>
            <span
              className={`text-2xl font-bold transform transition-transform duration-300 ${
                openIndex === index ? "rotate-45" : "rotate-0"
              }`}
            >
              +
            </span>
          </button>

          {openIndex === index && (
            <div className="px-6 pb-6">
              <div className="mt-2 p-4 bg-white rounded-md border border-gray-200 shadow-inner">
                <p className="text-gray-700">{item.answer}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
