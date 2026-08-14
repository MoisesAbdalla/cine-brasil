import Link from 'next/link';

export function Cabecalho() {
  return (
    <header className="vidro fixed inset-x-0 top-0 z-50 border-b border-borda/40">
      <div className="mx-auto flex w-full max-w-7xl items-baseline justify-between px-5 py-5">
        <Link href="/" className="font-serif text-2xl italic">
          Cine <span className="text-acento not-italic">Brasil</span>
        </Link>
        <nav className="flex gap-6">
          <Link href="/" className="etiqueta hover:text-texto">
            Descobrir
          </Link>
          <Link href="/busca" className="etiqueta hover:text-texto">
            Buscar
          </Link>
          <Link href="/quero-ver" className="etiqueta hover:text-texto">
            Minha lista
          </Link>
        </nav>
      </div>
    </header>
  );
}
