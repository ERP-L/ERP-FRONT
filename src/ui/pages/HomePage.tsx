export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
        Bienvenido 
      </h1>
      
      <div className="glass-card rounded-[var(--radius)] p-6 border border-[hsl(var(--border))]">
        <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed">
          En proceso de desarrollo...
        </p>
      </div>
    </div>
  );
}
