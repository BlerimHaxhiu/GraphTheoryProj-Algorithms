// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Graph Algorithm Visualizer',
  description: 'A powerful tool for graph visualization and analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

