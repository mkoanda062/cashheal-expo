// src/hooks/useFinance.ts

import { useState, useCallback } from "react";
import { computeFinance, type CalcInput, type CalcOutput } from "../engine/financeEngine";


export function useFinance() {
  const [result, setResult] = useState<CalcOutput | null>(null);

  const compute = useCallback((input: CalcInput) => {
    return computeFinance(input).then((output) => {
      setResult(output);
      return output;
    });
  }, []);

  return { result, compute };
}
