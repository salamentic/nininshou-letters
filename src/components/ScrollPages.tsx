import { type RefObject } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type Props = {
  modalRef: RefObject<HTMLDivElement | null>;
};

export default function Page({ modalRef }: Props) {
  const { scrollYProgress } = useScroll({ container: modalRef });

  const rotate0 = useTransform(scrollYProgress, [0, 0.4], [0, -100]);
  const x0 = useTransform(scrollYProgress, [0, 0.4], [0, 200]);
  const y0 = useTransform(scrollYProgress, [0, 0.4], [0, 200]);

  return (
    <motion.div style={{ rotateZ: rotate0, x: x0, y: y0 }} />
  );
}
