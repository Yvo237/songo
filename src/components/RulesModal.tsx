interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl border border-amber-700/15"
        style={{ background: 'linear-gradient(180deg, #3A2610 0%, #2A180A 100%)' }}
      >
        <div className="sticky top-0 z-10 border-b border-amber-800/15 px-5 py-3.5 flex items-center justify-between" style={{ background: '#3A2610' }}>
          <h2 className="text-base sm:text-lg font-bold text-amber-200" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
            Regles du Songo
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400/50 hover:text-amber-300 flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-56px)] p-5 space-y-4 text-amber-200/70 text-[13px] sm:text-sm leading-relaxed">
          <Sec title="Objectif">
            <p>Capturer au moins <strong className="text-amber-200">40 graines</strong> sur les 70 en jeu.</p>
          </Sec>
          <Sec title="Mise en place">
            <p><strong className="text-amber-200">14 cases</strong> (7 par joueur), chacune contenant <strong className="text-amber-200">5 graines</strong>.</p>
          </Sec>
          <Sec title="Comment jouer">
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Prenez toutes les graines d'une de vos cases.</li>
              <li>Distribuez-les une par une en sens anti-horaire.</li>
              <li>Plus de 13 graines : sautez la case de depart.</li>
            </ul>
          </Sec>
          <Sec title="Captures">
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Uniquement dans le camp adverse.</li>
              <li>Derniere graine dans une case de 2, 3 ou 4 : capture.</li>
              <li>Prise en chaine vers l'arriere.</li>
              <li>Case 1 adverse : pas de prise directe, sauf par chaine.</li>
            </ul>
          </Sec>
          <Sec title="Solidarite">
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Camp adverse vide : envoyez au moins 7 graines.</li>
              <li>Si impossible, envoyez le maximum.</li>
            </ul>
          </Sec>
          <Sec title="Interdits">
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Case 7 avec 1-2 graines : elles reviennent a l'adversaire.</li>
              <li>Interdit de vider le camp adverse par capture.</li>
            </ul>
          </Sec>
          <Sec title="Fin de partie">
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>40 graines atteintes.</li>
              <li>Moins de 10 graines en jeu.</li>
              <li>Solidarite impossible.</li>
            </ul>
          </Sec>
        </div>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-amber-300 font-bold text-sm sm:text-[15px] mb-1">{title}</h3>
      {children}
    </section>
  );
}
