import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Cafés para Barbie", description: "Encuentra los cafés más cercanos, pruébalos y califícalos.", applicationName: "Cafés para Barbie", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "Cafés para Barbie", statusBarStyle: "default" }, icons: { icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }] } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#B75D46" };
export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="es" className="h-full antialiased"><body className="min-h-full">{children}</body></html>; }
