/**
 * TypeScript DSL Parser for Quality Attributes
 * Handles parsing of DSL text into structured AST and program objects
 */

import type {
  DSLProgram,
  Token,
  TokenType,
  ASTNode,
  ASTNodeType,
  ParseResult,
  ValidationError,
  System,
  Attribute,
  Artifact,
  Scenario,
  StimulusSource,
  Stimulus,
  Environment,
  Response,
  Measure,
  QualityCategory
} from '../types/DSL.types';

/**
 * Main DSL Parser class
 * Converts DSL text into structured program representation
 */
export class DSLParser {
  private tokens: Token[] = [];
  private current = 0;
  private errors: ValidationError[] = [];

  /**
   * Parse DSL text into a program
   * @param dslText The DSL text to parse
   * @returns ParseResult with program or errors
   */
  static parseDSL(dslText: string): ParseResult {
    const parser = new DSLParser();
    return parser.parse(dslText);
  }

  /**
   * Main parse method
   * @param dslText The DSL text to parse
   * @returns ParseResult with program or errors
   */
  private parse(dslText: string): ParseResult {
    try {
      this.reset();
      this.tokens = this.tokenize(dslText);
      
      const ast = this.parseProgram();
      const program = this.astToProgram(ast);

      return {
        success: this.errors.length === 0,
        program: this.errors.length === 0 ? program : undefined,
        errors: this.errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      this.addError(errorMessage, 0, 'error');
      
      return {
        success: false,
        errors: this.errors
      };
    }
  }

  /**
   * Tokenize the input text into tokens
   * @param text The text to tokenize
   * @returns Array of tokens
   */
  private tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let line = 1;
    let column = 1;

    while (position < text.length) {
      const tokenMatch = this.matchToken(text, position, line, column);

      if (tokenMatch) {
        if (tokenMatch.token) {
          tokens.push(tokenMatch.token);
        }

        position += tokenMatch.length;
        line = tokenMatch.line;
        column = tokenMatch.column;
        continue;
      }

      tokens.push({
        type: 'UNKNOWN',
        value: text[position],
        position,
        line,
        column
      });
      position++;
      column++;
    }

    // Add EOF token
    tokens.push({
      type: 'EOF',
      value: '',
      position,
      line,
      column
    });

    return tokens;
  }

  /**
   * Parse the program (top-level AST node)
   * @returns ASTNode representing the program
   */
  private parseProgram(): ASTNode {
    const children: ASTNode[] = [];

    const node: ASTNode = {
      type: 'Program',
      position: 0,
      children
    };

    while (!this.isAtEnd()) {
      if (this.match('KEYWORD_SYSTEM')) {
        const systemNode = this.parseSystemDeclaration();
        if (systemNode) children.push(systemNode);
      } else if (this.match('KEYWORD_ATTRIBUTE')) {
        const attributeNode = this.parseAttributeDeclaration();
        if (attributeNode) children.push(attributeNode);
      } else {
        this.advance();
      }
    }

    return node;
  }

  /**
   * Parse system declaration
   * @returns ASTNode for system declaration
   */
  private parseSystemDeclaration(): ASTNode | null {
    const systemIdentifier = this.consume('IDENTIFIER', 'Expected system name');
    if (!systemIdentifier) return null;

    return {
      type: 'SystemDeclaration',
      position: systemIdentifier.position,
      children: [
        {
          type: 'Identifier',
          position: systemIdentifier.position,
          children: undefined
        }
      ]
    };
  }

  /**
   * Parse attribute declaration
   * @returns ASTNode for attribute declaration
   */
  private parseAttributeDeclaration(): ASTNode | null {
    const attributeIdentifier = this.consume('IDENTIFIER', 'Expected attribute name');
    if (!attributeIdentifier) return null;

    this.consume('LBRACE', 'Expected \'{\'');

    const children: ASTNode[] = [];
    
    // Parse artifact
    if (this.match('KEYWORD_ARTIFACT')) {
      const artifactNode = this.parseArtifactDeclaration();
      if (artifactNode) children.push(artifactNode);
    }

    // Parse category
    if (this.match('KEYWORD_CATEGORY')) {
      const categoryNode = this.parseCategoryDeclaration();
      if (categoryNode) children.push(categoryNode);
    }

    // Parse scenario
    const scenarioNode = this.parseScenarioDeclaration();
    if (scenarioNode) children.push(scenarioNode);

    this.consume('RBRACE', 'Expected \'}\'');

    return {
      type: 'AttributeDeclaration',
      position: attributeIdentifier.position,
      children
    };
  }

  /**
   * Parse artifact declaration
   * @returns ASTNode for artifact declaration
   */
  private parseArtifactDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected artifact name');
    
    if (!stringToken) return null;

    this.match('COMMA');

    return {
      type: 'ArtifactDeclaration',
      position: stringToken.position,
      children: [
        {
          type: 'StringLiteral',
          position: stringToken.position,
          children: undefined
        }
      ]
    };
  }

  /**
   * Parse category declaration
   * @returns ASTNode for category declaration
   */
  private parseCategoryDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const firstToken = this.consume('IDENTIFIER', 'Expected category value');
    if (!firstToken) return null;

    let categoryValue = firstToken.value;
    const position = firstToken.position;

    while (this.match('DOT')) {
      const partToken = this.consume('IDENTIFIER', 'Expected category part');
      if (!partToken) break;
      categoryValue += `.${partToken.value}`;
    }

    this.match('COMMA');

    return {
      type: 'CategoryDeclaration',
      position,
      value: categoryValue,
      children: [
        {
          type: 'CategoryLiteral',
          position,
          value: categoryValue,
          children: undefined
        }
      ]
    };
  }

  /**
   * Parse scenario declaration
   * @returns ASTNode for scenario declaration
   */
  private parseScenarioDeclaration(): ASTNode | null {
    const children: ASTNode[] = [];

    const scenarioParts = [
      ['KEYWORD_SOURCE', () => this.parseSourceDeclaration()],
      ['KEYWORD_STIMULUS', () => this.parseStimulusDeclaration()],
      ['KEYWORD_ENVIRONMENT', () => this.parseEnvironmentDeclaration()],
      ['KEYWORD_RESPONSE', () => this.parseResponseDeclaration()],
      ['KEYWORD_MEASURE', () => this.parseMeasureDeclaration()]
    ] as const;

    for (const [keyword, parseDeclaration] of scenarioParts) {
      const scenarioNode = this.parseScenarioComponent(keyword, parseDeclaration);
      if (scenarioNode) children.push(scenarioNode);
    }

    return {
      type: 'ScenarioDeclaration',
      position: children.length > 0 ? children[0].position : 0,
      children
    };
  }

  private parseScenarioComponent(
    keyword: TokenType,
    parseDeclaration: () => ASTNode | null
  ): ASTNode | null {
    if (!this.match(keyword)) return null;

    return parseDeclaration();
  }

  // Helper methods for parsing scenario components
  private parseSourceDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected source value');
    this.match('COMMA');
    return this.createStringNode('SourceDeclaration', stringToken);
  }

  private parseStimulusDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected stimulus value');
    this.match('COMMA');
    return this.createStringNode('StimulusDeclaration', stringToken);
  }

  private parseEnvironmentDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected environment value');
    this.match('COMMA');
    return this.createStringNode('EnvironmentDeclaration', stringToken);
  }

  private parseResponseDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected response value');
    this.match('COMMA');
    return this.createStringNode('ResponseDeclaration', stringToken);
  }

  private parseMeasureDeclaration(): ASTNode | null {
    this.consume('COLON', 'Expected \':\'');
    const stringToken = this.consume('STRING', 'Expected measure value');
    this.match('COMMA');
    return this.createStringNode('MeasureDeclaration', stringToken);
  }

  private createStringNode(type: ASTNodeType, token: Token | null): ASTNode | null {
    if (!token) return null;
    
    return {
      type,
      position: token.position,
      children: [
        {
          type: 'StringLiteral',
          position: token.position,
          children: undefined
        }
      ]
    };
  }

  /**
   * Convert AST to Program object
   * @param ast The AST to convert
   * @returns DSLProgram object
   */
  private astToProgram(ast: ASTNode): DSLProgram {
    const program: DSLProgram = {
      system: { name: '', attributes: [] },
      allAttributes: [],
      errors: []
    };

    if (!ast.children) return program;

    for (const child of ast.children) {
      if (child.type === 'SystemDeclaration' && child.children) {
        program.system = this.astToSystem(child);
      } else if (child.type === 'AttributeDeclaration') {
        const attribute = this.astToAttribute(child);
        if (attribute) {
          program.allAttributes.push(attribute);
          program.system.attributes.push(attribute);
        }
      }
    }

    return program;
  }

  private astToSystem(node: ASTNode): System {
    let name = 'Default System';
    if (node.children && node.children.length > 0) {
      const identifierNode = node.children[0];
      if (identifierNode.type === 'Identifier' && identifierNode.children) {
        // Extract the actual name from the token
        const token = this.tokens.find(t => t.position === identifierNode.position);
        if (token) name = token.value;
      }
    }
    return {
      name,
      attributes: []
    };
  }

  private astToAttribute(node: ASTNode): Attribute | null {
    if (!node.children) return null;

    const attribute: Attribute = {
      name: 'Default Attribute',
      artifact: { name: '' },
      category: 'FunctionalSuitability.FunctionalCompleteness',
      scenario: {
        source: { text: '' },
        stimulus: { text: '' },
        environment: { text: '' },
        response: { text: '' },
        measure: { text: '' }
      }
    };

    // Parse children to fill attribute details
    for (const child of node.children) {
      switch (child.type) {
        case 'ArtifactDeclaration':
          attribute.artifact = this.astToArtifact(child);
          break;
        case 'CategoryDeclaration':
          attribute.category = this.astToCategory(child);
          break;
        case 'ScenarioDeclaration':
          attribute.scenario = this.astToScenario(child);
          break;
      }
    }

    return attribute;
  }

  private astToArtifact(node: ASTNode): Artifact {
    let name = 'Default Artifact';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) name = token.value.replaceAll('"', '');
      }
    }
    return { name };
  }

  private astToCategory(node: ASTNode): QualityCategory {
    let category = node.value ?? 'FunctionalSuitability.FunctionalCompleteness';

    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.value) {
        category = stringNode.value;
      } else if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) category = token.value.replaceAll('"', '');
      } else if (stringNode.type === 'Identifier') {
        // Handle unquoted categories
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) category = token.value;
      }
    }
    return category as QualityCategory;
  }

  private astToScenario(node: ASTNode): Scenario {
    const scenario: Scenario = {
      source: { text: 'Default Source' },
      stimulus: { text: 'Default Stimulus' },
      environment: { text: 'Default Environment' },
      response: { text: 'Default Response' },
      measure: { text: 'Default Measure' }
    };

    if (!node.children) return scenario;

    for (const child of node.children) {
      switch (child.type) {
        case 'SourceDeclaration':
          scenario.source = this.astToStimulusSource(child);
          break;
        case 'StimulusDeclaration':
          scenario.stimulus = this.astToStimulus(child);
          break;
        case 'EnvironmentDeclaration':
          scenario.environment = this.astToEnvironment(child);
          break;
        case 'ResponseDeclaration':
          scenario.response = this.astToResponse(child);
          break;
        case 'MeasureDeclaration':
          scenario.measure = this.astToMeasure(child);
          break;
      }
    }

    return scenario;
  }

  private astToStimulusSource(node: ASTNode): StimulusSource {
    let text = 'Default Source';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) text = token.value.replaceAll('"', '');
      }
    }
    return { text };
  }

  private astToStimulus(node: ASTNode): Stimulus {
    let text = 'Default Stimulus';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) text = token.value.replaceAll('"', '');
      }
    }
    return { text };
  }

  private astToEnvironment(node: ASTNode): Environment {
    let text = 'Default Environment';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) text = token.value.replaceAll('"', '');
      }
    }
    return { text };
  }

  private astToResponse(node: ASTNode): Response {
    let text = 'Default Response';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) text = token.value.replaceAll('"', '');
      }
    }
    return { text };
  }

  private astToMeasure(node: ASTNode): Measure {
    let text = 'Default Measure';
    if (node.children && node.children.length > 0) {
      const stringNode = node.children[0];
      if (stringNode.type === 'StringLiteral') {
        const token = this.tokens.find(t => t.position === stringNode.position);
        if (token) text = token.value.replaceAll('"', '');
      }
    }
    return { text };
  }

  private getTokenPatterns(): Array<{ type: TokenType; pattern: RegExp }> {
    return [
      { type: 'KEYWORD_SYSTEM', pattern: /\bsystem\b/ },
      { type: 'KEYWORD_ATTRIBUTE', pattern: /\battribute\b/ },
      { type: 'KEYWORD_ARTIFACT', pattern: /\bartifact\b/ },
      { type: 'KEYWORD_CATEGORY', pattern: /\bcategory\b/ },
      { type: 'KEYWORD_SOURCE', pattern: /\bsource\b/ },
      { type: 'KEYWORD_STIMULUS', pattern: /\bstimulus\b/ },
      { type: 'KEYWORD_ENVIRONMENT', pattern: /\benvironment\b/ },
      { type: 'KEYWORD_RESPONSE', pattern: /\bresponse\b/ },
      { type: 'KEYWORD_MEASURE', pattern: /\bmeasure\b/ },
      { type: 'STRING', pattern: /"([^"]*)"/ },
      { type: 'IDENTIFIER', pattern: /[A-Za-z_]\w*/ },
      { type: 'NUMBER', pattern: /\b\d+(\.\d+)?\b/ },
      { type: 'LBRACE', pattern: /{/ },
      { type: 'RBRACE', pattern: /}/ },
      { type: 'COLON', pattern: /:/ },
      { type: 'COMMA', pattern: /,/ },
      { type: 'DOT', pattern: /\./ },
      { type: 'WHITESPACE', pattern: /\s+/ }
    ];
  }

  private matchToken(
    text: string,
    position: number,
    line: number,
    column: number
  ): { token: Token | null; length: number; line: number; column: number } | null {
    const remainingText = text.slice(position);

    for (const { type, pattern } of this.getTokenPatterns()) {
      const regex = new RegExp(`^${pattern.source}`);
      const match = regex.exec(remainingText);

      if (!match) continue;

      const matchedText = match[0];
      const nextLineAndColumn = this.advancePosition(matchedText, line, column);

      return {
        token:
          type === 'WHITESPACE'
            ? null
            : {
                type,
                value: matchedText,
                position,
                line,
                column
              },
        length: matchedText.length,
        line: nextLineAndColumn.line,
        column: nextLineAndColumn.column
      };
    }

    return null;
  }

  private advancePosition(
    matchedText: string,
    line: number,
    column: number
  ): { line: number; column: number } {
    const newlines = matchedText.match(/\n/g);

    if (newlines) {
      return {
        line: line + newlines.length,
        column: 1
      };
    }

    return {
      line,
      column: column + matchedText.length
    };
  }

  // Token handling helper methods
  private reset(): void {
    this.tokens = [];
    this.current = 0;
    this.errors = [];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token | null {
    if (this.check(type)) return this.advance();
    
    this.addError(message, this.peek().position, 'error');
    return null;
  }

  private addError(message: string, position: number, severity: 'error' | 'warning'): void {
    const token = this.tokens.find(t => t.position === position);
    const line = token ? token.line : 1;
    const column = token ? token.column : 1;
    const context = token ? `at line ${line}, column ${column}` : `at position ${position}`;
    
    this.errors.push({
      message: `${message} ${context}`,
      position,
      severity,
      line,
      column
    });
  }
}
