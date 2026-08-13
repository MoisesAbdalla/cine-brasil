import Link from 'next/link';

export function Opcao({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? 'true' : undefined}
      className={`etiqueta rounded-sm border px-3 py-1.5 ${
        ativo ? 'border-acento !text-acento' : 'border-borda hover:!text-texto'
      }`}
    >
      {children}
    </Link>
  );
}
