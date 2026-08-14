export interface RespostaPaginada<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface FilmeResumoTmdb {
  id: number;
  title: string;
  poster_path: string | null;
  /** A descoberta já devolve estes dois; o herói da home vive deles. */
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  vote_average: number;
}

export interface GeneroTmdb {
  id: number;
  name: string;
}

export interface ProvedorTmdb {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface PessoaElencoTmdb {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface MembroEquipeTmdb {
  id: number;
  name: string;
  job: string;
}

export interface VideoTmdb {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface FilmeDetalheTmdb extends FilmeResumoTmdb {
  backdrop_path: string | null;
  overview: string;
  runtime: number | null;
  genres: GeneroTmdb[];
  credits?: { cast: PessoaElencoTmdb[]; crew: MembroEquipeTmdb[] };
  videos?: { results: VideoTmdb[] };
  similar?: RespostaPaginada<FilmeResumoTmdb>;
  'watch/providers'?: {
    results?: Record<string, { flatrate?: ProvedorTmdb[]; free?: ProvedorTmdb[]; ads?: ProvedorTmdb[] }>;
  };
}
