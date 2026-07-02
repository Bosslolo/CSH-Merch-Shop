const TICKER_ITEMS = [
  "Christliche Schule im Hegau",
  "Seit 2006",
  "Lerne lernen — lerne leben",
  "Hilzingen · Baden-Württemberg",
  "Gemeinschaft",
  "CSH Merch",
  "Miteinander · Voneinander · Füreinander",
];

export default function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="csh-marquee" aria-hidden="true">
      <div className="csh-marquee__track">
        {items.map((item, i) => (
          <span key={i} className="csh-marquee__item">
            {item}
            <span className="csh-marquee__dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
