"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { initSound, playClick } from "@/lib/play/sound";

export function PlayIntro({
  onStart,
  cta = "Começar",
}: {
  onStart: (name: string, classCode: string) => void;
  cta?: string;
}) {
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Field label="Seu nome ou apelido" htmlFor="playerName">
        <Input
          id="playerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field label="Código da turma" htmlFor="classCode" hint="Opcional.">
        <Input
          id="classCode"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Button
        type="button"
        className="w-full"
        disabled={name.trim().length === 0}
        onClick={() => {
          initSound(); // destrava o áudio (gesto do usuário)
          playClick();
          onStart(name.trim(), classCode.trim());
        }}
      >
        {cta}
      </Button>
    </motion.div>
  );
}
