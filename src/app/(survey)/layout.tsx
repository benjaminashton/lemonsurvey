export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
      <footer className="py-6 text-center text-xs text-zinc-700">
        Propulsé par <span className="lemon-gradient-text font-semibold">LemonSurvey</span>
      </footer>
    </div>
  );
}
