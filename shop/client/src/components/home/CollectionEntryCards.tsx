import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";
import { useCatalog } from "@/hooks/useCatalog";

function collectionHref(id: string) {
  if (id === "large") return "/kollektion/gross";
  if (id === "small") return "/kollektion/klein";
  return `/kollektion/${encodeURIComponent(id)}`;
}

export default function CollectionEntryCards() {
  const { collections, products } = useCatalog();
  const ordered = [...collections].sort((a, b) => {
    if (a.id === "large") return -1;
    if (b.id === "large") return 1;
    if (a.id === "small") return -1;
    if (b.id === "small") return 1;
    return a.name.localeCompare(b.name, "de");
  });

  return (
    <section id="kollektion" className="csh-collection-entry">
      <div className="csh-collection-entry__header">
        <p className="csh-label">Kollektionen</p>
        <h2 className="csh-serif csh-collection-entry__title">Ein Schulgeist.</h2>
      </div>
      <div className="csh-collection-entry__grid">
        {ordered.map((collection, index) => {
          const count = products.filter((product) => product.collection === collection.id).length;
          const image =
            collection.id === "small" ? catalog.hero.lifestylePingpong : catalog.panel.collectionInset;
          return (
            <motion.article
              key={collection.id}
              className={`csh-collection-entry__card${collection.badge ? " csh-collection-entry__card--soon" : ""}`}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ ...transition, delay: index * 0.06 }}
            >
              <Link
                href={collectionHref(collection.id)}
                className="csh-collection-entry__link"
                onClick={() => scrollToTop()}
              >
                <div className="csh-collection-entry__media">
                  <img
                    src={image}
                    alt={collection.name}
                    loading="lazy"
                  />
                  {collection.badge && (
                    <span className="csh-collection-entry__badge">{collection.badge}</span>
                  )}
                </div>
                <div className="csh-collection-entry__body">
                  <h3 className="csh-serif">{collection.name}</h3>
                  <p className="csh-body">
                    {count > 0 ? `${count} Artikel · ` : ""}
                    {collection.cardNote || collection.lead}
                  </p>
                  <span className="csh-link">
                    {collection.id === "small" && count === 0 ? "Mehr erfahren" : "Kollektion ansehen"}
                  </span>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
