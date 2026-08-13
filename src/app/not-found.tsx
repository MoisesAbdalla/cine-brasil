import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-serif text-3xl">Filme não encontrado</h1>
      <p className="mx-auto mt-3 max-w-md text-suave">
        Esse endereço não corresponde a nenhum filme do catálogo.
      </p>
      <Link href="/" className="etiqueta mt-6 inline-block hover:text-texto">
        Voltar para a descoberta
      </Link>
    </div>
  );
}
