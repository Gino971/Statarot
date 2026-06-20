import { useState } from 'react'
import {
  getDefenderOvercutRiskProbability,
  getDistribution,
  getKingNotCutFirstRoundProbability,
  getKnightNotCutGivenQueenNotCutProbability,
  getKnightNotCutThirdRoundProbability,
  getQueenNotCutGivenKingNotCutProbability,
  getQueenNotCutSecondRoundProbability,
  tarotModel,
} from './lib/tarotStats'
import './App.css'

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function App() {
  const [trumpsInHand, setTrumpsInHand] = useState(10)
  const [suitCardsInHand, setSuitCardsInHand] = useState(6)
  const [suitCardsDiscardedToDog, setSuitCardsDiscardedToDog] = useState(3)

  const distribution = getDistribution(trumpsInHand)
  const atLeastDistribution = distribution.map((row) => ({
    trumpsInDog: row.trumpsInDog,
    probability: distribution
      .filter((candidate) => candidate.trumpsInDog >= row.trumpsInDog)
      .reduce((sum, candidate) => sum + candidate.probability, 0),
  }))
  const kingNotCut = getKingNotCutFirstRoundProbability(suitCardsInHand)
  const queenNotCut = getQueenNotCutSecondRoundProbability(suitCardsInHand)
  const queenNotCutGivenKingNotCut =
    getQueenNotCutGivenKingNotCutProbability(suitCardsInHand)
  const knightNotCut = getKnightNotCutThirdRoundProbability(suitCardsInHand)
  const knightNotCutGivenQueenNotCut =
    getKnightNotCutGivenQueenNotCutProbability(suitCardsInHand)
  const defenderOvercutRisk = getDefenderOvercutRiskProbability(
    trumpsInHand,
    suitCardsDiscardedToDog,
  )

  return (
    <main className="app-shell">
      <header className="compact-header">
        <p className="eyebrow">Tarot a 4 joueurs</p>
        <h1>Statarot - probabilites exactes</h1>
      </header>

      <section className="compact-card">
        <div className="row-head">
          <h2>Atouts au chien</h2>
          <span>Au moins k atouts sur {tarotModel.dogSize} cartes</span>
        </div>
        <div className="control-line">
          <label htmlFor="trumpsInHand">Atouts en main: {trumpsInHand}</label>
          <input
            id="trumpsInHand"
            aria-label="Nombre d'atouts en main"
            className="slider"
            max={tarotModel.handSize}
            min={0}
            onChange={(event) => setTrumpsInHand(Number(event.target.value))}
            type="range"
            value={trumpsInHand}
          />
        </div>
        <div className="exact-grid" aria-label="Probabilites exactes atouts au chien">
          {atLeastDistribution
            .filter((row) => row.trumpsInDog > 0)
            .map((row) => (
            <article className="exact-cell" key={row.trumpsInDog}>
              <strong>{`>= ${row.trumpsInDog}`}</strong>
              <span>atout(s) au chien</span>
              <b>{percentFormatter.format(row.probability)}</b>
            </article>
            ))}
        </div>
      </section>

      <section className="compact-card">
        <div className="row-head">
          <h2>Surcoupe defense</h2>
          <span>Modele ecart de couleur</span>
        </div>
        <div className="control-line">
          <label htmlFor="suitCardsDiscardedToDog">
            x cartes de cette couleur mises a l'ecart: {suitCardsDiscardedToDog}
          </label>
          <input
            id="suitCardsDiscardedToDog"
            className="slider"
            min={0}
            max={tarotModel.dogSize}
            onChange={(event) =>
              setSuitCardsDiscardedToDog(Number(event.target.value))
            }
            type="range"
            value={suitCardsDiscardedToDog}
          />
        </div>
        <article className="single-result">
          <p>
            Probabilite qu'au moins un defenseur puisse surcouper quand tu coupes
            cette couleur:
          </p>
          <strong>{percentFormatter.format(defenderOvercutRisk)}</strong>
          <small>
            Hypothese: apres ecart tu n'as plus de carte dans cette couleur
            (coupe assuree), et un defenseur est compte en surcoupeur s'il est
            sec dans la couleur et possede au moins un atout.
          </small>
        </article>
      </section>

      <section className="compact-card">
        <div className="row-head">
          <h2>Mariage x-ieme</h2>
          <span>Roi, Dame, Cavalier tenus selon x</span>
        </div>
        <div className="control-line">
          <label htmlFor="suitCardsInHand">
            Longueur de couleur en main (x): {suitCardsInHand}
          </label>
          <input
            id="suitCardsInHand"
            className="slider"
            min={1}
            max={tarotModel.suitSize}
            onChange={(event) => setSuitCardsInHand(Number(event.target.value))}
            type="range"
            value={suitCardsInHand}
          />
        </div>
        <article className="single-result">
          <p>Probabilites exactes de non-coupe:</p>
          <div className="pair-results">
            <div className="pair-cell">
              <span>Roi joue au 1er tour</span>
              <strong>{percentFormatter.format(kingNotCut)}</strong>
            </div>
            {suitCardsInHand >= 2 ? (
              <div className="pair-cell">
                <span>Dame ensuite sachant roi non coupe</span>
                <strong>{percentFormatter.format(queenNotCutGivenKingNotCut)}</strong>
              </div>
            ) : null}
            {suitCardsInHand >= 3 ? (
              <div className="pair-cell">
                <span>Cavalier ensuite sachant dame non coupee</span>
                <strong>{percentFormatter.format(knightNotCutGivenQueenNotCut)}</strong>
              </div>
            ) : null}
          </div>
          <small>
            Reperes non conditionnels:{' '}
            {suitCardsInHand >= 2
              ? `dame ${percentFormatter.format(queenNotCut)}`
              : 'dame non affichee (x < 2)'}
            {suitCardsInHand >= 3
              ? `, cavalier ${percentFormatter.format(knightNotCut)}`
              : ', cavalier non affiche (x < 3)'}.
          </small>
        </article>
      </section>

      <footer className="compact-footer">
        <span>Modele hypergeometrique exact</span>
        <span>
          Excuse non comptee dans les atouts, 21 atouts numerotes pris en compte
        </span>
        <span>{decimalFormatter.format(100)}% de masse de probabilite</span>
      </footer>
    </main>
  )
}

export default App
