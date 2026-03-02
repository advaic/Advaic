// app/app/layout.tsx

export const metadata = {
  title: "Advaic",
  description: "Dein AI-gestützter Maklerassistent",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
