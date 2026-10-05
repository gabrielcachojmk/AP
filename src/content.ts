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
  memory: { src: '/memories/01-memoria.svg', alt: 'Uma manhã comum, nós duas à mesa' } satisfies Photo,
  admiration: [
    { src: '/memories/02-admiro-a.svg', alt: 'Ana entrando em um cômodo' },
    { src: '/memories/03-admiro-b.svg', alt: 'Ana ouvindo até o fim' },
    { src: '/memories/04-admiro-c.svg', alt: 'Ana escolhendo o certo' },
    { src: '/memories/05-admiro-d.svg', alt: 'Ana sendo o eixo' },
  ] satisfies Photo[],
  pride: { src: '/memories/06-orgulho.svg', alt: 'Retrato da Ana' } satisfies Photo,
  home: [
    { src: '/memories/07-casa-a.svg', alt: 'Nós duas' },
    { src: '/memories/08-casa-b.svg', alt: 'A nossa mesa' },
  ] satisfies [Photo, Photo],
  horizon: { src: '/memories/09-horizonte.svg', alt: 'Um caminho ao amanhecer' } satisfies Photo,
  echo: { src: '/memories/10-eco.svg', alt: 'Uma foto quieta de nós' } satisfies Photo,
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
    kicker: 'uma memória',
    lines: [
      'Ainda é de manhã na minha cabeça.',
      'Você do outro lado da mesa, a xícara esquecida, falando de um dia comum como se ele merecesse atenção.',
      'Eu lembro do silêncio que ficou depois. Não era vazio. Era a certeza de que eu queria todos os dias comuns — se fossem com você.',
    ],
  },

  admiration: {
    kicker: 'o que admiro',
    fragments: [
      'Admiro a forma como você entra num cômodo e ele muda de temperatura.',
      'Admiro que você escuta até o fim — mesmo quando já sabe o que vai dizer.',
      'Admiro a coragem quieta: a de escolher o certo quando o fácil estava na mesa.',
      'Admiro que você não precisa ser o centro para ser o eixo.',
    ],
  },

  pride: {
    kicker: 'orgulho',
    lead: 'Tenho orgulho da mulher que você é quando ninguém está olhando.',
    body:
      'Da disciplina com os próprios sonhos. Do jeito de crescer sem anunciar. Das vezes em que o mundo pediu menos de você e você entregou inteira mesmo assim.',
    close: 'Você minimiza. Eu não.',
  },

  home: {
    kicker: 'o que você é',
    lines: [
      'Você é família no sentido mais simples: é para onde eu volto.',
      'É a mesa. É o nós. É a pessoa com quem a minha história deixa de ser só minha.',
      'Não é que você faz parte da minha vida. É que, com você, a vida ganhou um endereço.',
    ],
  },

  horizon: {
    kicker: 'os próximos anos',
    lines: [
      'Os próximos anos não pedem que você seja mais do que já é.',
      'Pedem que você não diminua o que já cabe em você.',
      'Quando o medo aparecer, eu estarei do mesmo lado da porta.',
    ],
    final: 'Pode ir. Eu fico. E vou com você.',
  },

  echo: {
    line: 'Continua sendo isto: você é o lugar para onde eu volto.',
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
