/**
 * Todo o conteúdo pessoal da carta vive aqui.
 * Troque textos, fotos e senha sem tocar nas cenas.
 */

export type Photo = {
  src: string
  alt: string
}

export const recipient = 'Ana'
export const sender = 'Gabriel'

/** Senha escrita no cartão dentro do envelope físico. Case-insensitive. */
export const password = 'analinda'

export const date = {
  iso: '2026-10-07',
  label: '07 de outubro de 2026',
}

export const photos = {
  memory: { src: '/memories/01-memoria.jpg', alt: 'Ana no Chile, o dia em que nos conhecemos' } satisfies Photo,
  admiration: [
    { src: '/memories/02-admiro-a.jpg', alt: 'Ana no pôr do sol, sorrindo' },
    { src: '/memories/03-admiro-b.jpg', alt: 'Brinde de Aperol no pôr do sol' },
    { src: '/memories/04-admiro-c.jpg', alt: 'Nossas mãos entrelaçadas no avião' },
    { src: '/memories/05-admiro-d.png', alt: 'Nós dois no barco, no mar' },
  ] satisfies Photo[],
  pride: { src: '/memories/06-orgulho.jpg', alt: 'Ana sorrindo com hambúrguer e batata' } satisfies Photo,
  home: [
    { src: '/memories/07-casa-a.jpg', alt: 'Ana nadando na água cristalina' },
    { src: '/memories/08-casa-b.jpg', alt: 'Ana dormindo nas cadeiras do aeroporto' },
  ] satisfies [Photo, Photo],
  horizon: { src: '/memories/09-horizonte.jpg', alt: 'Ana no restaurante, sorrindo' } satisfies Photo,
  echo: { src: '/memories/10-eco.jpg', alt: 'Ana no Coliseu, ao entardecer' } satisfies Photo,
}

export const scenes = {
  ritual: {
    envelopeName: recipient,
    afterSeal: 'Para o meu amor',
    hint: 'toque para abrir',
  },

  thesis: {
    greeting: `${recipient},`,
    paragraphs: [
      'A distância nunca nos impediu de nada, e não seria agora que ela impediria.',
      'Quanto mais tempo a gente passa junto, mais passo a te admirar. Que essa carta seja um lembrete disso: da mulher que você é aos meus olhos.',
      'O que vem depois destas páginas são alguns lembretes do quanto você brilha para o mundo e para mim.',
    ],
    cta: 'Continua',
  },

  memory: {
    lines: [
      'Foi no Chile que a gente se conheceu.',
      'Foi pouco tempo juntos, e mesmo assim intenso o bastante pra eu te enxergar de verdade naquele dia, no pouco que deu pra conhecer você.',
      'E foi o suficiente pra eu saber que todo esforço valia a pena por uma pessoa como você.',
    ],
  },

  admiration: {
    fragments: [
      'Nem todo mundo tem a sorte de encontrar a sua pessoa na vida.',
      'Aquela que, diante de um mundo inteiro, é sua de um jeito quieto e certo.',
      'E que, diante de um mundo infinito, encontra aconchego, confiança e casa um no outro.',
      'Palavras que, de mil maneiras, sempre voltam pro mesmo lugar: você.',
    ],
  },

  pride: {
    lead: 'Tenho orgulho de ter te encontrado, e de reconhecer desde então quem você é pra mim.',
    body:
      'Não é sorte comum. É a certeza quieta de que, no meio de tanta gente, você é a pessoa com quem o mundo ganha sentido. A pessoa com quem o esforço deixa de parecer peso e passa a parecer caminho. A pessoa que, mesmo longe, continua sendo direção.',
    close: 'E amor, pra uma palavra de quatro letras, cabe muito pouco do que eu sinto por você.',
  },

  home: {
    lines: [
      'Você é o encontro. O aconchego. A confiança. O lugar onde a gente respira sem precisar explicar.',
      'É a pessoa diante de quem o mundo inteiro cabe, e ainda sobra espaço pra nós dois.',
      'Não é que eu te encontrei no mundo. É que, com você, o mundo encontrou lugar.',
    ],
  },

  horizon: {
    lines: [
      'Que a gente continue se encontrando no esforço, na distância, nos dias bons e nos difíceis.',
      'Que a confiança continue sendo o chão onde a gente pisa, mesmo quando o caminho apertar.',
      'E que o amor, mesmo quando a palavra for pequena demais pra caber o que a gente sente, continue sendo o que a gente escolhe fazer.',
    ],
    final: 'Você é a minha pessoa. Eu fico, e vou, com você.',
  },

  echo: {
    line: 'Porque, no fim, tudo se resume a isto: o que eu sinto por você não cabe em quatro letras.',
    date: date.label,
    signoff: 'Com amor,',
    signature: sender,
    again: 'ler de novo',
  },
}

/**
 * Áudio opcional. Deixe as strings vazias para silêncio.
 * Coloque os arquivos em public/audio/ e preencha os caminhos.
 */
export const audio = {
  paper: '',
  ambience: '',
}
