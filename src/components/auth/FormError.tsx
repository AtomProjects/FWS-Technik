import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
  visible?: boolean;
}

const FormError = ({
  message = "An error occurred",
  visible = false,
}: FormErrorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: visible ? 1 : 0,
        height: visible ? "auto" : 0,
      }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 text-sm text-destructive overflow-hidden"
    >
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </motion.div>
  );
};

export default FormError;
