import "./globals.css";

export const metadata = {
  title: "Zoom Clone - Video Conferencing",
  description: "A professional video conferencing and meeting planning platform inspired by Zoom.",
};

/**
 * The root layout for our Next.js App Router application.
 * Wraps all pages and mounts the global CSS styling.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-[#F7F9FC] text-gray-900 antialiased min-h-screen"
      >
        {children}
      </body>
    </html>
  );
}
