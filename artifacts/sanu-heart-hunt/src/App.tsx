import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Heart, ArrowRight, RotateCcw, Sparkles, MailOpen, LockKeyhole } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const TARGET = 4;

const memoryPhotos = [
  '/assets/sanu-portrait.jpeg',
  '/assets/sanu-portrait-2.jpeg',
  '/assets/memory-01-rooftop.jpg',
  '/assets/memory-02-night-garden.jpg',
  '/assets/memory-03-mirror.jpg',
  '/assets/memory-04-cuddle.jpg',
  '/assets/memory-05-sunlit-portrait.jpg',
  '/assets/memory-06-soft-collage.jpg',
  '/assets/memory-07-mirror-hug.jpg',
  '/assets/memory-08-bedroom-selfie.jpg',
  '/assets/memory-09-cat-room.jpg',
  '/assets/memory-10-photo-wall.jpg',
  '/assets/memory-11-pink-mirror.jpg',
  '/assets/memory-12-window-portrait.jpg',
  '/assets/memory-13-closeup.jpg',
  '/assets/memory-14-warm-hug.jpg',
  '/assets/memory-15-cafe.jpg',
  '/assets/memory-16-night-collage.jpg',
];

type GamePhase = 'intro' | 'game' | 'bouquet' | 'letter' | 'photos';
type Interlude = 'first' | 'second' | null;

type SecretCard = {
  id: string;
  pair: string;
  label: string;
  glyph: string;
};

const SECRET_CARDS: SecretCard[] = [
  { id: 'sanu-a', pair: 'sanu', label: 'Sanu', glyph: '♡' },
  { id: 'always-a', pair: 'always', label: 'always', glyph: '∞' },
  { id: 'laughs-a', pair: 'laughs', label: 'laughs', glyph: '✦' },
  { id: 'home-a', pair: 'home', label: 'home', glyph: '⌂' },
  { id: 'home-b', pair: 'home', label: 'home', glyph: '⌂' },
  { id: 'laughs-b', pair: 'laughs', label: 'laughs', glyph: '✦' },
  { id: 'always-b', pair: 'always', label: 'always', glyph: '∞' },
  { id: 'sanu-b', pair: 'sanu', label: 'Sanu', glyph: '♡' },
];

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="screen intro-screen">
      <div className="intro-orbit" aria-hidden="true" />
      <div className="intro-orbit intro-orbit-two" aria-hidden="true" />

      <section className="intro-copy" aria-labelledby="intro-title">
        <div className="intro-kicker name-chip">a tiny world for sunaina</div>

        <h1 id="intro-title" className="display intro-title">
          Sanu<br /><em>Heart Hunt</em>
        </h1>

        <p className="intro-subtitle">
          A little adventure for my favorite girl ❤️
        </p>

        <button
          type="button"
          className="start-button"
          onClick={onStart}
          data-testid="button-start-hunt"
        >
          Open your little world <ArrowRight size={17} aria-hidden="true" />
        </button>

        <p className="intro-foot">
          made with unreasonable amounts of love · just for you
        </p>
      </section>
    </main>
  );
}

function InterludeCard({
  kind,
  onContinue,
}: {
  kind: Exclude<Interlude, null>;
  onContinue: () => void;
}) {
  const first = kind === 'first';

  return (
    <div
      className="interlude-wrap"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interlude-title"
    >
      <section className="interlude">
        <div className="interlude-mark">
          <Sparkles size={13} aria-hidden="true" />
          secret unlocked · {first ? '01' : '02'}
        </div>

        <h2 id="interlude-title">
          {first
            ? 'You found the soft spot.'
            : 'Okay, one tiny confession.'}
        </h2>

        <p>
          {first ? (
            <>
              Sanu, you make me want to save the smallest moments. The random
              calls, the nonsense, the way you say my name when you&apos;re
              pretending not to be amused.
            </>
          ) : (
            <>
              Still waiting for you to admit that I&apos;m usually right (You
              know I am). I&apos;ll let you keep thinking about it while you
              find the next heart.
            </>
          )}
        </p>

        <button
          type="button"
          className="continue-button"
          onClick={onContinue}
          data-testid={`button-continue-${kind}`}
        >
          {first ? 'Keep looking, Kuchu Muchu' : 'There is one more thing'}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

function GameScreen({ onWin }: { onWin: () => void }) {
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [interlude, setInterlude] = useState<Interlude>(null);
  const [feedback, setFeedback] = useState<{
    id: number;
    kind: 'match' | 'miss';
    message: string;
  } | null>(null);

  const pairLines = [
    'that feels like us',
    'keep this little thing',
    'one of my favorites',
    'you found our secret',
  ];

  const chooseCard = (card: SecretCard) => {
    if (
      locked ||
      interlude ||
      matched.has(card.pair) ||
      flipped.includes(card.id)
    ) return;

    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    const firstCard = SECRET_CARDS.find(
      (candidate) => candidate.id === nextFlipped[0],
    );
    if (!firstCard) return;

    setLocked(true);

    if (firstCard.pair === card.pair) {
      const nextMatched = new Set(matched).add(card.pair);
      const nextScore = nextMatched.size;

      setMatched(nextMatched);
      setFlipped([]);
      setLocked(false);
      setFeedback({
        id: Date.now(),
        kind: 'match',
        message: pairLines[(nextScore - 1) % pairLines.length],
      });

      if (nextScore === 1) {
        setInterlude('first');
      } else if (nextScore === 3) {
        setInterlude('second');
      } else if (nextScore >= TARGET) {
        window.setTimeout(onWin, 620);
      }
    } else {
      setFeedback({
        id: Date.now(),
        kind: 'miss',
        message: 'not quite — try another two',
      });

      window.setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 720);
    }
  };

  return (
    <main className="screen game-shell">
      <header className="game-top">
        <div className="brand-mark">
          <Heart className="mark-heart" size={19} aria-hidden="true" />
          Sanu Heart Hunt
        </div>

        <div className="score-panel" aria-live="polite">
          <div className="score-label">pairs found</div>

          <div className="score-value" data-testid="text-score">
            {String(matched.size).padStart(2, '0')} / {String(TARGET).padStart(2, '0')}
          </div>
        </div>
      </header>

      <div
        className="progress-track"
        aria-label={`${matched.size} of ${TARGET} secret pairs found`}
        role="progressbar"
        aria-valuenow={matched.size}
        aria-valuemin={0}
        aria-valuemax={TARGET}
      >
        <div
          className="progress-fill"
          style={{ width: `${(matched.size / TARGET) * 100}%` }}
        />
      </div>

      <section className="game-intro">
        <div>
          <h1 className="display game-heading">
            Find our little<br /><em>secret pairs.</em>
          </h1>
        </div>

        <p className="game-help">
          Turn over two at a time.<br />
          Match the little things that feel like us.
        </p>
      </section>

      <section
        className="game-board"
        aria-label="Find our secret pairs memory game"
      >
        <div className="secret-meter">
          <LockKeyhole size={12} aria-hidden="true" />
          <span>secret pairs</span>
          <b>{matched.size} / {TARGET}</b>
        </div>

        <div className="moon" aria-hidden="true" />
        <div className="hill hill-back" aria-hidden="true" />
        <div className="hill" aria-hidden="true" />
        <div className="tree tree-one" aria-hidden="true" />
        <div className="tree tree-two" aria-hidden="true" />

        <span className="spark spark-one" aria-hidden="true" />
        <span className="spark spark-two" aria-hidden="true" />
        <span className="spark spark-three" aria-hidden="true" />

        {feedback && (
          <div
            className={`memory-feedback memory-feedback--${feedback.kind}`}
            key={feedback.id}
            aria-live="polite"
          >
            {feedback.kind === 'match' ? (
              <Heart size={13} fill="currentColor" aria-hidden="true" />
            ) : (
              <Sparkles size={13} aria-hidden="true" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="memory-grid">
          {SECRET_CARDS.map((card) => {
            const isFlipped = flipped.includes(card.id);
            const isMatched = matched.has(card.pair);
            const isVisible = isFlipped || isMatched;

            return (
              <button
                type="button"
                key={card.id}
                className={`memory-tile ${isVisible ? 'is-visible' : ''} ${
                  isMatched ? 'is-matched' : ''
                }`}
                onClick={() => chooseCard(card)}
                disabled={locked || isVisible || Boolean(interlude)}
                aria-label={
                  isVisible
                    ? `Revealed card: ${card.label}`
                    : `Turn over secret card ${card.id}`
                }
                data-testid={`button-secret-card-${card.id}`}
              >
                <span className="memory-tile-inner">
                  <span className="memory-tile-face memory-tile-back" aria-hidden="true">
                    <Heart size={21} fill="currentColor" />
                    <small>keep me</small>
                  </span>
                  <span className="memory-tile-face memory-tile-front">
                    <b>{card.glyph}</b>
                    <small>{card.label}</small>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="board-bottom">
          <div>
            <span className="hint">our little secret</span>

            <b data-testid="text-capture-message">
              {matched.size === 0
                ? 'turn over a little secret'
                : matched.size < 2
                  ? 'that one belongs to us'
                  : matched.size < TARGET
                    ? 'you know me too well'
                    : 'you found the way in'}
            </b>
          </div>

          <div className="hint">
            <Sparkles size={11} aria-hidden="true" />
            {Math.max(TARGET - matched.size, 0)} left
          </div>
        </div>

        {interlude && (
          <InterludeCard
            kind={interlude}
            onContinue={() => setInterlude(null)}
          />
        )}
      </section>
    </main>
  );
}

function BouquetArt() {
  const flowers = [
    {
      className: 'flower flower--rose',
      left: '22%',
      top: '26%',
      size: '1.02',
    },
    {
      className: 'flower flower--coral',
      left: '47%',
      top: '12%',
      size: '.85',
    },
    {
      className: 'flower flower--gold',
      left: '70%',
      top: '28%',
      size: '.9',
    },
    {
      className: 'flower flower--small',
      left: '36%',
      top: '42%',
      size: '.62',
    },
    {
      className: 'flower flower--small flower--peach',
      left: '60%',
      top: '48%',
      size: '.58',
    },
  ];

  return (
    <div
      className="bouquet-art"
      aria-label="A bouquet assembling itself for you"
    >
      <div className="bouquet-glow" />

      <div className="bouquet-sparkles" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      <div className="stems" aria-hidden="true">
        <b /><b /><b /><b /><b />
      </div>

      <div className="leaves" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>

      {flowers.map((flower) => (
        <div
          key={`${flower.left}-${flower.top}`}
          className={flower.className}
          style={{
            left: flower.left,
            top: flower.top,
            '--flower-scale': flower.size,
          } as CSSProperties}
          aria-hidden="true"
        >
          <i /><i /><i /><i /><b />
        </div>
      ))}

      <div className="bouquet-ribbon" aria-hidden="true">
        <i /><i /><b />
      </div>

      <div className="bouquet-paper" aria-hidden="true" />
    </div>
  );
}

function BouquetScreen({
  onOpenLetter,
}: {
  onOpenLetter: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [assemblyStep, setAssemblyStep] = useState(0);

  useEffect(() => {
    const stepTimers = [450, 1150, 1950, 2850, 3900].map(
      (delay, index) =>
        window.setTimeout(
          () => setAssemblyStep(index + 1),
          delay,
        ),
    );

    const readyTimer = window.setTimeout(
      () => setReady(true),
      4550,
    );

    return () => {
      stepTimers.forEach((timer) =>
        window.clearTimeout(timer),
      );

      window.clearTimeout(readyTimer);
    };
  }, []);

  const assemblyLines = [
    'Wait… something is blooming.',
    'The stems are finding their shape.',
    'A few soft blooms, just for you.',
    'Tying it together with a little love.',
    'Almost ready for you, babygirl.',
    'I wanted to give you something that felt as lovely as finding you.',
  ];

  return (
    <main className="screen bouquet-screen">
      <div className="celebration-confetti" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i />
      </div>

      <section
        className="bouquet-stage"
        aria-labelledby="bouquet-title"
      >
        <div className="eyebrow">
          all the hearts · gathered
        </div>

        <h1
          id="bouquet-title"
          className="display bouquet-title"
        >
          For you,<br /><em>my babygirl</em>
        </h1>

        <p className="bouquet-copy" aria-live="polite">
          {assemblyLines[ready ? 5 : assemblyStep] ??
            assemblyLines[0]}
        </p>

        <BouquetArt />

        <div
          className={`bouquet-action ${
            ready ? 'bouquet-action--ready' : ''
          }`}
        >
          <button
            type="button"
            className="open-letter-button"
            onClick={onOpenLetter}
            disabled={!ready}
            data-testid="button-open-letter"
          >
            <MailOpen size={16} aria-hidden="true" />
            {ready ? 'Open your letter' : 'Let it bloom'}
          </button>

          <span>
            {ready
              ? 'kept safe for you'
              : 'a little surprise is arriving'}
          </span>
        </div>
      </section>
    </main>
  );
}

/*
 * CHAPTER THREE — LETTER
 *
 * FIX:
 * The letter content and fullLetter are memoized so they keep
 * the same reference between renders.
 *
 * The typing interval starts once when the envelope is opened
 * and is cleaned up correctly.
 */
function LetterScreen({
  onReplay,
  onWall,
}: {
  onReplay: () => void;
  onWall: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [typedCount, setTypedCount] = useState(0);

  const letterBlocks = useMemo(
    () => [
      {
        text: 'Okay last ma euta kura',
        className: '',
      },
      {
        text: 'I don’t know how to explain what you mean to me.',
        className: '',
      },
      {
        text: 'Timi mero life ma aayepachi\neven normal days feel special.',
        className: '',
      },
      {
        text: 'I love talking to you, annoying you,\nand obviously losing control when you annoy me back.',
        className: '',
      },
      {
        text: 'Bas jindagi jasto sukai hos\ntimi ra ma sangai hasna paam.',
        className: '',
      },
      {
        text: 'I love you, Sanu.\nDherai.',
        className: 'letter-love-line',
      },
      {
        text: 'Ani…',
        className: '',
      },
      {
        text: 'this is not the end.\nHamro story ta bharkhar suru bhako ho.',
        className: 'letter-last',
      },
    ],
    [],
  );

  const fullLetter = useMemo(
    () => letterBlocks.map((block) => block.text).join('\n'),
    [letterBlocks],
  );

  useEffect(() => {
    if (!opened) {
      setTypedCount(0);
      return;
    }

    let current = 0;

    const timer = window.setInterval(() => {
      current += 1;

      setTypedCount(current);

      if (current >= fullLetter.length) {
        window.clearInterval(timer);
      }
    }, 25);

    return () => {
      window.clearInterval(timer);
    };
  }, [opened, fullLetter]);

  let letterOffset = 0;

  const typedBlocks = letterBlocks.map((block) => {
    const start = letterOffset;

    letterOffset += block.text.length + 1;

    const visibleLength = Math.max(
      Math.min(
        typedCount - start,
        block.text.length,
      ),
      0,
    );

    return {
      ...block,
      text: block.text.slice(0, visibleLength),
    };
  });

  const activeBlockIndex = typedBlocks.findIndex(
    (block, index) =>
      block.text.length > 0 &&
      block.text.length <
        letterBlocks[index].text.length,
  );

  const isTyping =
    opened &&
    typedCount < fullLetter.length;

  return (
    <main className="screen letter-screen">
      <div className="letter-heading">
        <div className="eyebrow">
          chapter three · kept in my drawer
        </div>

        <h1 className="display">
          A letter for<br />
          <em>you my girl</em>
        </h1>

        {!opened && (
          <p>
            Some things deserve to be opened slowly.
          </p>
        )}
      </div>

      <div
        className={`letter-stage ${
          opened ? 'letter-stage--opened' : ''
        }`}
      >
        <div className="letter-burst" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>

        <article
          className="love-letter"
          aria-label="A handwritten love letter for you my girl"
          data-testid="text-love-note"
        >
          <div
            className="letter-paper-corner"
            aria-hidden="true"
          >
            ♡
          </div>

          <div className="letter-date">
            somewhere between today &amp; forever
          </div>

          {!opened && (
            <button
              type="button"
              className="letter-cover"
              onClick={() => setOpened(true)}
              aria-label="Open the love letter"
              data-testid="button-open-envelope"
            >
              <span className="cover-heart">
                <Heart
                  size={23}
                  fill="currentColor"
                  aria-hidden="true"
                />
              </span>

              <span>open this slowly</span>
            </button>
          )}

          <div
            className={`letter-writing ${
              opened
                ? 'letter-writing--visible'
                : ''
            }`}
          >
            {typedBlocks.map((block, index) => (
              <p
                className={block.className}
                key={index}
              >
                {block.text}

                {isTyping &&
                  index === activeBlockIndex && (
                    <span
                      className="type-caret"
                      aria-hidden="true"
                    />
                  )}
              </p>
            ))}
          </div>

          <div
            className={`letter-signature ${
              opened
                ? 'letter-signature--visible'
                : ''
            }`}
          >
            always yours, <i>me</i>
          </div>
        </article>
      </div>

      <div className="letter-footer">
        <button
          type="button"
          className="wall-button"
          onClick={onWall}
          data-testid="button-open-photo-wall"
        >
          <Heart
            size={14}
            fill="currentColor"
            aria-hidden="true"
          />
          See our little wall
        </button>

        <button
          type="button"
          className="again-button"
          onClick={onReplay}
          data-testid="button-replay"
        >
          <RotateCcw
            size={14}
            aria-hidden="true"
          />
          Start over
        </button>
      </div>
    </main>
  );
}

function PhotoWallScreen({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <main className="screen photo-wall-screen">
      <div
        className="photo-wall-orbit"
        aria-hidden="true"
      />

      <header className="photo-wall-header">
        <button
          type="button"
          className="wall-back"
          onClick={onBack}
          aria-label="Back to the letter"
        >
          <ArrowRight
            size={16}
            aria-hidden="true"
          />
        </button>

        <div
          className="wall-heart"
          aria-hidden="true"
        >
          <Heart
            size={15}
            fill="currentColor"
          />
        </div>
      </header>

      <section
        className="photo-wall-content"
        aria-labelledby="photo-wall-title"
      >
        <div className="photo-wall-kicker">♡</div>

        <h1
          id="photo-wall-title"
          className="display photo-wall-title"
        >
          our little<br /><em>wall</em>
        </h1>

        <div className="photo-wall-grid">
          {memoryPhotos.map((src, index) => (
            <figure
              className={`wall-photo wall-photo--${
                index % 6
              }`}
              key={src}
            >
              <img
                src={src}
                alt=""
                loading={
                  index > 2
                    ? 'lazy'
                    : 'eager'
                }
              />

              <Heart
                className="wall-photo-heart"
                size={11}
                fill="currentColor"
                aria-hidden="true"
              />
            </figure>
          ))}
        </div>

        <button
          type="button"
          className="wall-close"
          onClick={onBack}
          aria-label="Back to the letter"
        >
          <ArrowRight
            size={15}
            aria-hidden="true"
          />
          back to us
        </button>
      </section>
    </main>
  );
}

function Home() {
  const [phase, setPhase] =
    useState<GamePhase>('intro');

  useEffect(() => {
    document.title =
      phase === 'letter'
        ? 'For Sanu, always'
        : phase === 'photos'
          ? 'Our little wall'
          : phase === 'bouquet'
            ? 'A surprise for Sanu'
            : 'Sanu Heart Hunt';
  }, [phase]);

  if (phase === 'intro') {
    return (
      <IntroScreen
        onStart={() => setPhase('game')}
      />
    );
  }

  if (phase === 'game') {
    return (
      <GameScreen
        onWin={() => setPhase('bouquet')}
      />
    );
  }

  if (phase === 'bouquet') {
    return (
      <BouquetScreen
        onOpenLetter={() => setPhase('letter')}
      />
    );
  }

  if (phase === 'photos') {
    return (
      <PhotoWallScreen
        onBack={() => setPhase('letter')}
      />
    );
  }

  return (
    <LetterScreen
      onReplay={() => setPhase('intro')}
      onWall={() => setPhase('photos')}
    />
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route
          path="/"
          component={Home}
        />

        <Route
          component={NotFound}
        />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      {children}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(
            /\/$/,
            '',
          )}
        >
          <Router />
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
