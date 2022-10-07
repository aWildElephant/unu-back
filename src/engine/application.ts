import { shuffle } from "~/util/shuffle";
import { deck } from "./card";
import { Command } from "./command";
import { Event } from "./event"
import { PlayerIdAlreadyExists, NotEnoughPlayers, NotYourTurn, TooManyPlayers, InvalidGameStatus } from './exceptions'
import { GameState, GameStatus, Player } from "./game";

function applyEvent(gameState: GameState, event: Event): void {
    const type = event.type

    switch (type) {
        case "player-added":
            gameState.players.submit(new Player(event.playerId))
            break
        case "played-cards-repurposed":
            gameState.repurposePlayedCards()
            break
        case "card-drawn":
            const card = gameState.remainingCards.pop()
            if (card) {
                // TODO: get player by id instead of getting current
                gameState.players.head()?.hand.addCard(card)
            }
            break
        case "card-added-to-deck":
            gameState.remainingCards.push(event.card)
            break
        case "first-card-set":
            const firstCard = gameState.remainingCards.pop()
            if (firstCard) {
                gameState.playedCards.push(firstCard)
            }
            break
        default:
            console.error("Unsupported event '%s'", type)
    }
}

/**
 * Command-sourcing
 */
export class Application {

    private gameState = new GameState()
    private store: Command[] = []

    process(command: Command): Event[] {
        const events = this.validate(command)

        events.forEach(this.apply)

        this.store.push(command)

        return events
    }

    private apply(event: Event): void {
        applyEvent(this.gameState, event)
    }

    private validate(command: Command): Event[] {
        const gameStatus = this.gameState.status

        const events: Event[] = []

        const type = command.type
        switch (type) {
            case "add-player":
                // Player cannot join mid-game
                if (gameStatus !== GameStatus.WAITING) {
                    throw new InvalidGameStatus(GameStatus.WAITING, this.gameState.status)
                }

                // There is a maximum of 10 players
                if (this.gameState.numberOfPlayers() >= 10) {
                    throw new TooManyPlayers()
                }

                const newPlayerId = command.playerId

                if (this.gameState.playerExists(newPlayerId)) {
                    throw new PlayerIdAlreadyExists(newPlayerId)
                }

                events.push({
                    type: "player-added",
                    playerId: newPlayerId
                })

                break
            case "start":
                // There is a minimum of 2 players
                if (this.gameState.numberOfPlayers() < 2) {
                    throw new NotEnoughPlayers()
                }

                // Fill the deck

                const cards = shuffle(deck())

                cards.forEach(card => {
                    events.push({
                        type: "card-added-to-deck",
                        card
                    })
                })

                // Draw 7 cards for each player

                const playerIds = this.gameState.playerIds()

                for (let i = 0; i < 7; i++) {
                    playerIds.forEach(playerId => {
                        events.push({
                            type: "card-drawn",
                            playerId
                        })
                    })
                }

                // Set first card

                events.push({
                    type: "first-card-set"
                })

                break
            case "draw":
                const currentPlayer = this.gameState.currentPlayer()

                const drawingPlayerId = command.playerId

                // Only current player can draw a card
                if (currentPlayer.id !== drawingPlayerId) {
                    throw new NotYourTurn()
                }

                if (this.gameState.remainingCards.size() <= 0) {
                    events.push({
                        type: "played-cards-repurposed"
                    })
                }

                events.push({
                    type: "card-drawn",
                    playerId: drawingPlayerId
                })

                break
            case "play":
                console.log("Command 'play' not implemented") // TODO
                break
            case "skip":
                console.log("Command 'skip' not implemented") // TODO
                break
            case "unu":
                console.log("Command 'unu' not implemented") // TODO
                break
            default:
                console.error(`Command '${type}' unknown`) // TODO
        }

        return events
    }
}