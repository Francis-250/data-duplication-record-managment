import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/hooks/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "University of Kigali | Data Deduplication & Record Matching System",
    template: "%s | UoK Record Deduplication",
  },
  description:
    "Institutional Data Deduplication and Record Matching System for the University of Kigali (UoK). Identifies duplicate and matching student records, standardizes institutional data, computes similarity scores, and enables non-destructive record consolidation.",
  applicationName: "UoK Record Deduplication",
  authors: [{ name: "University of Kigali Directorate of ICT & Academic Registry" }],
  creator: "University of Kigali",
  publisher: "University of Kigali",
  keywords: [
    "University of Kigali",
    "UoK",
    "Data Deduplication",
    "Record Matching",
    "Entity Resolution",
    "Student Information System",
    "Academic Registry",
    "Fellegi-Sunter",
    "Rwanda Higher Education",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "University of Kigali — Data Deduplication & Record Matching System",
    description:
      "Enterprise student record matching, similarity analysis, and non-destructive record consolidation for the University of Kigali.",
    siteName: "UoK Record Deduplication",
    locale: "en_RW",
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
