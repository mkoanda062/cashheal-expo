// src/contexts/CurrencyContext.tsx

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import storage from "../utils/persistentStorage";

export type Currency = "CAD" | "USD" | "EUR" | "XOF" | "GBP" | "CNY";

type CurrencyCtx = {
  currency: Currency;
  setCurrency: (c: Currency) => Promise<void>;
  format: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const STORAGE_KEY = "currency";

const CURRENCY_LOCALES: Record<Currency, string> = {
  EUR: "fr-FR",
  USD: "en-US",
  GBP: "en-GB",
  CAD: "en-CA",
  CNY: "zh-CN",
  XOF: "fr-BF",
};

const SUPPORTED_CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "CAD", "CNY", "XOF"];

const CurrencyContext = createContext<CurrencyCtx | null>(null);

const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_CURRENCIES.includes(stored as Currency)) {
          setCurrencyState(stored as Currency);
        }
      } catch (error) {
        console.warn("Impossible de charger la devise sauvegardée", error);
      }
    })();
  }, []);

  const setCurrency = useCallback(async (nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    try {
      await storage.setItem(STORAGE_KEY, nextCurrency);
    } catch (error) {
      console.warn("Impossible d'enregistrer la devise", error);
    }
  }, []);

  const format = useMemo(() => {
    return (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
        style: "currency",
        currency,
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
        ...options,
      }).format(value);
  }, [currency]);

  const value = useMemo(() => ({ currency, setCurrency, format }), [currency, setCurrency, format]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export { CurrencyProvider, SUPPORTED_CURRENCIES };
