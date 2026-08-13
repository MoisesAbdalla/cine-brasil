'use client';

import { useState } from 'react';

export function Trailer({ youtubeId, titulo }: { youtubeId: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="rounded-sm border border-borda px-5 py-2 text-sm hover:border-acento hover:text-acento"
      >
        ▶ Ver trailer
      </button>
    );
  }

  return (
    <div className="aspect-video w-full max-w-2xl">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
        title={`Trailer de ${titulo}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
