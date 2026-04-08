import { useState } from "react";

export function useTextEditingState() {
  const [activeTextInput, setActiveTextInput] = useState<string | null>(null);

  return {
    activeTextInput,
    focusTextInput: (name: string) => setActiveTextInput(name),
    blurTextInput: (name: string) =>
      setActiveTextInput((current) => (current === name ? null : current)),
  };
}
