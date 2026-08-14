import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' }],
    /*
     * O CDN do TMDB já entrega cada imagem no tamanho pedido (w92, w342, w1280),
     * então reprocessá-las só acrescenta um salto de rede, um ponto de falha e
     * consumo de cota de otimização — sem ganho. Com o otimizador ligado, uma
     * página cheia de pôsteres derrubava parte deles com tempo esgotado (504).
     */
    unoptimized: true,
  },
};

export default nextConfig;
