import { expect } from "chai"
import { Application } from "~/engine/application"
import { Card, CardColor, CardNumber, ChangeDirectionCard, Draw2Card, NumberCard } from "~/engine/card"
import { Command } from "~/engine/command"

describe('Play command', function () {
    it("should throw an error if the player tries to play a card that isn't in his hand", () => {
        const application = new Application()
        application.apply({
            type: "player-added",
            playerId: "p"
        })
        application.apply({
            type: "card-played",
            card: new NumberCard(CardNumber.ONE, CardColor.BLUE)
        })
        application.apply({
            type: "card-added-to-hand",
            playerId: "p",
            card: new NumberCard(CardNumber.TWO, CardColor.RED)
        })

        const command: Command = {
            type: "play",
            playerId: "p",
            card: new Draw2Card(CardColor.BLUE)
        }
        expect(() => application.process(command)).to.throw()
    })

    // TODO: test that a player cannot play if it isn't his turn (unless he's cutting)

    const scenarios: { previous: Card, played: Card, valid: boolean }[] = [
        {
            previous: new NumberCard(CardNumber.ONE, CardColor.BLUE),
            played: new NumberCard(CardNumber.TWO, CardColor.BLUE),
            valid: true
        },
        {
            previous: new NumberCard(CardNumber.ONE, CardColor.BLUE),
            played: new NumberCard(CardNumber.TWO, CardColor.YELLOW),
            valid: false
        },
        {
            previous: new Draw2Card(CardColor.GREEN),
            played: new Draw2Card(CardColor.RED),
            valid: true
        },
        {
            previous: new ChangeDirectionCard(CardColor.RED),
            played: new Draw2Card(CardColor.BLUE),
            valid: false
        }
    ]

    for (const scenario of scenarios) {
        it(`playing ${scenario.played.name()} after ${scenario.previous.name()}`, () => {
            const application = new Application()
            application.apply({
                type: "player-added",
                playerId: "p"
            })
            application.apply({
                type: "card-played",
                card: scenario.previous
            })
            application.apply({
                type: "card-added-to-hand",
                card: scenario.played,
                playerId: "p"
            })

            const command: Command = {
                type: "play",
                playerId: "p",
                card: scenario.played
            }
            if (scenario.valid) {
                const expected = [{
                    type: "card-removed-from-hand",
                    playerId: "p",
                    card: scenario.played
                },
                {
                    type: "card-played",
                    card: scenario.played
                }]

                expect(application.process(command)).to.deep.equal(expected)
            } else {
                expect(() => application.process(command)).to.throw()
            }
        })
    }
})