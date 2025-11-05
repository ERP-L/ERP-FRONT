export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
        Bienvenido 
      </h1>
      
      <div className="glass-card rounded-[var(--radius)] p-4 sm:p-6 border border-[hsl(var(--border))]">
        <p className="text-[hsl(var(--muted-foreground))] text-base sm:text-lg leading-relaxed">
          En proceso de desarrollo...
        </p>
      </div>
    </div>
  );
}
