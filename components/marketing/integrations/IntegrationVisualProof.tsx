import ProductStillFrame from "@/components/marketing/produkt/ProductStillFrame";

type ProofCard = {
  label: string;
  title: string;
  text: string;
  src: string;
  alt: string;
  caption: string;
  imageClassName?: string;
  aspectClassName?: string;
};

type IntegrationVisualProofProps = {
  cards: ProofCard[];
};

export default function IntegrationVisualProof({ cards }: IntegrationVisualProofProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3" data-tour="integrations-proof-grid">
      {cards.map((card, index) => (
        <article
          key={card.title}
          className="card-base overflow-hidden p-4 md:p-5"
          data-tour="integrations-proof-card"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {card.label}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--text)]">{card.title}</h3>
          <p className="helper mt-2">{card.text}</p>
          <div className="mt-4">
            <ProductStillFrame
              label={`Proof ${index + 1}`}
              src={card.src}
              alt={card.alt}
              caption={card.caption}
              imageClassName={card.imageClassName}
              aspectClassName={card.aspectClassName}
              className="shadow-none"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
