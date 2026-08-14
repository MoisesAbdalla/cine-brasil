import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' }],
    /*
     * O otimizador fica LIGADO de propósito, apesar de o CDN do TMDB já servir
     * os tamanhos exatos. O motivo não é o tamanho do arquivo: é alcance.
     *
     * As imagens do TMDB são entregues pela BunnyCDN, que é inalcançável em
     * algumas redes brasileiras (bloqueio de firewall, antivírus ou rota do
     * provedor). Com o otimizador ligado, quem busca a imagem é o servidor da
     * aplicação, e o navegador do visitante recebe tudo pelo domínio do próprio
     * site — então o bloqueio da CDN deixa de ser problema dele.
     *
     * Em desenvolvimento, numa máquina onde a BunnyCDN está bloqueada, isso
     * aparece como erro 504 no otimizador: o servidor local também não alcança.
     * É a rede, não a configuração.
     */
  },
};

export default nextConfig;
