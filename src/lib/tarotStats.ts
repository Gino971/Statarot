const TOTAL_CARDS = 78
const TOTAL_TRUMPS = 21
const SUIT_SIZE = 14
const HAND_SIZE = 18
const DOG_SIZE = 6
const OPPONENT_COUNT = 3

export type DistributionRow = {
  trumpsInDog: number
  probability: number
}

export type TarotModel = {
  totalCards: number
  totalTrumps: number
  suitSize: number
  handSize: number
  dogSize: number
  opponentCount: number
  unseenCards: number
}

export const tarotModel: TarotModel = {
  totalCards: TOTAL_CARDS,
  totalTrumps: TOTAL_TRUMPS,
  suitSize: SUIT_SIZE,
  handSize: HAND_SIZE,
  dogSize: DOG_SIZE,
  opponentCount: OPPONENT_COUNT,
  unseenCards: TOTAL_CARDS - HAND_SIZE,
}

function combination(n: number, k: number) {
  if (k < 0 || k > n) {
    return 0
  }

  const effectiveK = Math.min(k, n - k)
  let result = 1

  for (let index = 1; index <= effectiveK; index += 1) {
    result = (result * (n - effectiveK + index)) / index
  }

  return Math.round(result)
}

function boundedCompositions(target: number, minEach: number, maxEach: number) {
  const results: Array<[number, number, number]> = []

  for (let first = minEach; first <= maxEach; first += 1) {
    for (let second = minEach; second <= maxEach; second += 1) {
      const third = target - first - second

      if (third >= minEach && third <= maxEach) {
        results.push([first, second, third])
      }
    }
  }

  return results
}

export function getProbability(trumpsInHand: number, trumpsInDog: number) {
  const remainingTrumps = TOTAL_TRUMPS - trumpsInHand
  const remainingCards = TOTAL_CARDS - HAND_SIZE
  const remainingNonTrumps = remainingCards - remainingTrumps

  if (trumpsInHand < 0 || trumpsInHand > HAND_SIZE) {
    return 0
  }

  if (trumpsInDog < 0 || trumpsInDog > DOG_SIZE) {
    return 0
  }

  const numerator =
    combination(remainingTrumps, trumpsInDog) *
    combination(remainingNonTrumps, DOG_SIZE - trumpsInDog)
  const denominator = combination(remainingCards, DOG_SIZE)

  return numerator / denominator
}

export function getDistribution(trumpsInHand: number) {
  return Array.from({ length: DOG_SIZE + 1 }, (_, trumpsInDog) => ({
    trumpsInDog,
    probability: getProbability(trumpsInHand, trumpsInDog),
  }))
}

export function getExpectedTrumpsInDog(trumpsInHand: number) {
  return (DOG_SIZE * (TOTAL_TRUMPS - trumpsInHand)) / (TOTAL_CARDS - HAND_SIZE)
}

function getHonorNotCutProbability(
  suitCardsInHand: number,
  requiredCardsPerOpponent: number,
) {
  if (suitCardsInHand < 1 || suitCardsInHand > SUIT_SIZE) {
    return 0
  }

  const remainingSuitCards = SUIT_SIZE - suitCardsInHand
  const unseenCards = TOTAL_CARDS - HAND_SIZE
  const totalWays = combination(unseenCards, remainingSuitCards)

  let favorableWays = 0

  const minDogCards = Math.max(
    0,
    remainingSuitCards - OPPONENT_COUNT * HAND_SIZE,
  )
  const maxDogCards = Math.min(DOG_SIZE, remainingSuitCards)

  for (let dogCards = minDogCards; dogCards <= maxDogCards; dogCards += 1) {
    const cardsForOpponents = remainingSuitCards - dogCards
    const splits = boundedCompositions(
      cardsForOpponents,
      requiredCardsPerOpponent,
      HAND_SIZE,
    )

    for (const [leftOpponent, middleOpponent, rightOpponent] of splits) {
      favorableWays +=
        combination(DOG_SIZE, dogCards) *
        combination(HAND_SIZE, leftOpponent) *
        combination(HAND_SIZE, middleOpponent) *
        combination(HAND_SIZE, rightOpponent)
    }
  }

  return favorableWays / totalWays
}

export function getKingNotCutFirstRoundProbability(suitCardsInHand: number) {
  return getHonorNotCutProbability(suitCardsInHand, 1)
}

export function getQueenNotCutSecondRoundProbability(suitCardsInHand: number) {
  return getHonorNotCutProbability(suitCardsInHand, 2)
}

export function getKnightNotCutThirdRoundProbability(suitCardsInHand: number) {
  return getHonorNotCutProbability(suitCardsInHand, 3)
}

export function getQueenNotCutGivenKingNotCutProbability(
  suitCardsInHand: number,
) {
  const kingNotCut = getKingNotCutFirstRoundProbability(suitCardsInHand)

  if (kingNotCut === 0) {
    return 0
  }

  const queenNotCut = getQueenNotCutSecondRoundProbability(suitCardsInHand)
  return queenNotCut / kingNotCut
}

export function getKnightNotCutGivenQueenNotCutProbability(
  suitCardsInHand: number,
) {
  const queenNotCut = getQueenNotCutSecondRoundProbability(suitCardsInHand)

  if (queenNotCut === 0) {
    return 0
  }

  const knightNotCut = getKnightNotCutThirdRoundProbability(suitCardsInHand)
  return knightNotCut / queenNotCut
}

export function getDefenderOvercutRiskProbability(
  trumpsInHand: number,
  suitCardsDiscardedToDog: number,
) {
  if (trumpsInHand < 0 || trumpsInHand > HAND_SIZE) {
    return 0
  }

  if (suitCardsDiscardedToDog < 0 || suitCardsDiscardedToDog > DOG_SIZE) {
    return 0
  }

  const remainingSuitCards = SUIT_SIZE - suitCardsDiscardedToDog
  const remainingTrumps = TOTAL_TRUMPS - trumpsInHand
  const remainingOthers = tarotModel.unseenCards - remainingSuitCards - remainingTrumps

  if (remainingSuitCards < 0 || remainingTrumps < 0 || remainingOthers < 0) {
    return 0
  }

  const totalWays =
    combination(60, HAND_SIZE) *
    combination(42, HAND_SIZE) *
    combination(24, HAND_SIZE)

  let favorableWays = 0

  for (let suit1 = 0; suit1 <= Math.min(remainingSuitCards, HAND_SIZE); suit1 += 1) {
    for (
      let trumps1 = 0;
      trumps1 <= Math.min(remainingTrumps, HAND_SIZE - suit1);
      trumps1 += 1
    ) {
      const other1 = HAND_SIZE - suit1 - trumps1

      if (other1 > remainingOthers) {
        continue
      }

      const ways1 =
        combination(remainingSuitCards, suit1) *
        combination(remainingTrumps, trumps1) *
        combination(remainingOthers, other1)

      const suitAfter1 = remainingSuitCards - suit1
      const trumpsAfter1 = remainingTrumps - trumps1
      const othersAfter1 = remainingOthers - other1

      for (let suit2 = 0; suit2 <= Math.min(suitAfter1, HAND_SIZE); suit2 += 1) {
        for (
          let trumps2 = 0;
          trumps2 <= Math.min(trumpsAfter1, HAND_SIZE - suit2);
          trumps2 += 1
        ) {
          const other2 = HAND_SIZE - suit2 - trumps2

          if (other2 > othersAfter1) {
            continue
          }

          const ways2 =
            combination(suitAfter1, suit2) *
            combination(trumpsAfter1, trumps2) *
            combination(othersAfter1, other2)

          const suitAfter2 = suitAfter1 - suit2
          const trumpsAfter2 = trumpsAfter1 - trumps2
          const othersAfter2 = othersAfter1 - other2

          for (let suit3 = 0; suit3 <= Math.min(suitAfter2, HAND_SIZE); suit3 += 1) {
            for (
              let trumps3 = 0;
              trumps3 <= Math.min(trumpsAfter2, HAND_SIZE - suit3);
              trumps3 += 1
            ) {
              const other3 = HAND_SIZE - suit3 - trumps3

              if (other3 > othersAfter2) {
                continue
              }

              const defender1CanOvercut = suit1 === 0 && trumps1 > 0
              const defender2CanOvercut = suit2 === 0 && trumps2 > 0
              const defender3CanOvercut = suit3 === 0 && trumps3 > 0

              if (
                !defender1CanOvercut &&
                !defender2CanOvercut &&
                !defender3CanOvercut
              ) {
                continue
              }

              const ways3 =
                combination(suitAfter2, suit3) *
                combination(trumpsAfter2, trumps3) *
                combination(othersAfter2, other3)

              favorableWays += ways1 * ways2 * ways3
            }
          }
        }
      }
    }
  }

  return favorableWays / totalWays
}
