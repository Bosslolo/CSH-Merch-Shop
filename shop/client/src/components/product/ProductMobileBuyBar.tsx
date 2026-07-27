import { motion, AnimatePresence } from "framer-motion";
import { transitionDrawer } from "@/lib/motion";

interface Props {
  visible: boolean;
  name: string;
  price: number;
  size: string;
  disabled: boolean;
  onAdd: () => void;
}

export default function ProductMobileBuyBar({ visible, name, price, size, disabled, onAdd }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="product-page__mobile-bar"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={transitionDrawer}
        >
          <div className="product-page__mobile-bar-text">
            <strong>{name}</strong>
            <span>
              {size ? `Größe ${size}` : "Größe wählen"} · {price} €
            </span>
          </div>
          <button type="button" className="csh-btn product-page__mobile-bar-btn" disabled={disabled} onClick={onAdd}>
            In den Warenkorb
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
