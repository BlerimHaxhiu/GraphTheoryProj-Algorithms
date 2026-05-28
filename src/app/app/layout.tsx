import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Graph Algorithm Visualizer',
  description: 'Create, edit, and study graphs with graph algorithms.',
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // This div will expand to fill the <main> from RootLayout.
    // It's a flex container for its children (e.g., the page content with sidebar).
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}

