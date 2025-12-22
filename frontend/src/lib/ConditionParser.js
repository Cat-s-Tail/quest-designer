/**
 * Condition Parser - Parses AND/OR/() conditions into a tree structure
 * Example: "(mission.quest1 = completed AND var.level >= 10) OR mission.quest2 = unlocked"
 */

export class ConditionNode {
  constructor() {
    this.relation = 'AND' // 'AND' or 'OR'
    this.subNodes = [] // Array of ConditionNode or string (leaf)
    this.rawCondition = null // Only for leaf nodes
  }

  get isLeaf() {
    return this.rawCondition !== null
  }

  toString() {
    if (this.isLeaf) return `[${this.rawCondition}]`
    const subStr = this.subNodes.map(n => n.toString()).join(` ${this.relation} `)
    return `(${subStr})`
  }
}

export class ConditionParser {
  constructor(condition) {
    this.input = (condition || '').trim()
    this.position = 0
  }

  parse() {
    if (!this.input) {
      console.warn('[ConditionParser] Empty condition string')
      return null
    }

    try {
      this.position = 0
      return this.parseOr()
    } catch (ex) {
      console.error(`[ConditionParser] Failed to parse: ${this.input}`, ex)
      return null
    }
  }

  parseOr() {
    let left = this.parseAnd()

    while (this.matchKeyword('OR')) {
      this.consumeKeyword('OR')
      const right = this.parseAnd()

      const node = new ConditionNode()
      node.relation = 'OR'
      node.subNodes = [left, right]
      left = node
    }

    return left
  }

  parseAnd() {
    let left = this.parsePrimary()

    while (this.matchKeyword('AND')) {
      this.consumeKeyword('AND')
      const right = this.parsePrimary()

      const node = new ConditionNode()
      node.relation = 'AND'
      node.subNodes = [left, right]
      left = node
    }

    return left
  }

  parsePrimary() {
    this.skipWhitespace()

    // Handle parentheses
    if (this.position < this.input.length && this.input[this.position] === '(') {
      this.position++ // consume '('
      const node = this.parseOr() // recursive
      this.skipWhitespace()

      if (this.position >= this.input.length || this.input[this.position] !== ')') {
        throw new Error("Expected closing parenthesis ')'")
      }

      this.position++ // consume ')'
      return node
    }

    // Parse raw condition
    const condition = this.parseCondition()

    const leafNode = new ConditionNode()
    leafNode.relation = 'AND'
    leafNode.rawCondition = condition

    return leafNode
  }

  parseCondition() {
    this.skipWhitespace()
    const start = this.position

    while (this.position < this.input.length) {
      const c = this.input[this.position]

      if (c === '(' || c === ')') break

      // Check for AND/OR keywords
      if (this.position + 3 <= this.input.length) {
        const next3 = this.input.substring(this.position, this.position + 3).toUpperCase()
        if ((next3 === 'AND' || next3 === ' OR')) {
          if (this.position > start && /[a-zA-Z0-9]/.test(this.input[this.position - 1])) {
            break
          }
        }
      }

      this.position++
    }

    const result = this.input.substring(start, this.position).trim()

    if (!result) {
      throw new Error('Expected a condition')
    }

    return result
  }

  matchKeyword(keyword) {
    this.skipWhitespace()

    if (this.position + keyword.length > this.input.length) return false

    const segment = this.input.substring(this.position, this.position + keyword.length).toUpperCase()

    if (segment !== keyword) return false

    // Check word boundaries
    if (this.position > 0 && /[a-zA-Z0-9]/.test(this.input[this.position - 1])) return false

    if (this.position + keyword.length < this.input.length && /[a-zA-Z0-9]/.test(this.input[this.position + keyword.length])) {
      return false
    }

    return true
  }

  consumeKeyword(keyword) {
    if (!this.matchKeyword(keyword)) {
      throw new Error(`Expected '${keyword}'`)
    }
    this.position += keyword.length
  }

  skipWhitespace() {
    while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
      this.position++
    }
  }
}

// Test function
export function testParser() {
  const testCases = [
    'mission.quest1 = completed',
    'mission.quest1 = completed AND var.level >= 10',
    '(mission.quest1 = completed AND var.level >= 10) OR mission.quest2 = unlocked',
    'a AND (b OR c)',
    '((a AND b) OR (c AND d))'
  ]

  testCases.forEach(test => {
    const parser = new ConditionParser(test)
    const tree = parser.parse()
    console.log(`Input: ${test}`)
    console.log(`Tree: ${tree?.toString()}`)
    console.log('---')
  })
}

