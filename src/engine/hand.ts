import { Card } from './card'

const _ = require("lodash")

export class Hand {

    private cards: Card[] = []

    add(card: Card): void {
        this.cards.push(card)
    }

    contains(card: Card): boolean {
        return !!_.find(this.cards, (c: Card) => _.isEqual(c, card))
    }

    remove(card: Card): void {
        const index = _.findIndex(this.cards, (c: Card) => _.isEqual(c, card))

        if (index >= 0) {
            this.cards.splice(index, 1)
        }
    }

    size(): number {
        return this.cards.length
    }
}
