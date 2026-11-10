import AppProvider from "@/components/layout/AppProvider";
import Shell from "@/components/layout/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}
