import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function PageTransition({ children, className = "" }: Props) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
