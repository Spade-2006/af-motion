import React, { createContext, useContext, useEffect, useState } from "react";
import { THEME_TOKENS, type ThemeTokens } from "@/config/tokens";

interface ThemeContextValue {
  readonly tokens: ThemeTokens;
  readonly isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  tokens: THEME_TOKENS,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ tokens: THEME_TOKENS, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
