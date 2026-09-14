import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/hooks/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
    template: "%s | DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
  },
  description:
    "Institutional DATA DEDUPLICATION AND RECORD MATCHING SYSTEM. Identifies duplicate and matching student records, standardizes institutional data, computes similarity scores, and enables non-destructive record consolidation.",
  applicationName: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
  authors: [{ name: "Registry & Identity Verification Systems" }],
  creator: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
  publisher: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
  keywords: [
    "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
    "Data Deduplication",
    "Record Matching",
    "Entity Resolution",
    "Student Information System",
    "Academic Registry",
    "Fellegi-Sunter",
    "Record Linkage",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
    description:
      "Enterprise record matching, similarity analysis, and non-destructive record consolidation.",
    siteName: "DATA DEDUPLICATION AND RECORD MATCHING SYSTEM",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <head />
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
