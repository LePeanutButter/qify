/**
 * Core domain types for Quality Attribute DSL
 * Based on ISO 25010 standard
 */

/**
 * Represents a complete DSL program with system and attributes
 */
export interface DSLProgram {
  system: System;
  allAttributes: Attribute[];
  errors: ValidationError[];
}

/**
 * Represents a software system in the DSL
 */
export interface System {
  name: string;
  attributes: Attribute[];
}

/**
 * Represents a quality attribute with its scenario
 */
export interface Attribute {
  name: string;
  artifact: Artifact;
  category: QualityCategory;
  scenario: Scenario;
}

/**
 * Represents an artifact (component, service, etc.)
 */
export interface Artifact {
  name: string;
}

/**
 * Represents a scenario with stimulus-response
 */
export interface Scenario {
  source: StimulusSource;
  stimulus: Stimulus;
  environment: Environment;
  response: Response;
  measure: Measure;
}

/**
 * Text-based components for scenario
 */
export interface StimulusSource {
  text: string;
}

export interface Stimulus {
  text: string;
}

export interface Environment {
  text: string;
}

export interface Response {
  text: string;
}

export interface Measure {
  text: string;
}

/**
 * ISO 25010 Quality Categories
 */
export type QualityCategory = 
  | FunctionalSuitability
  | PerformanceEfficiency
  | Compatibility
  | InteractionCapability
  | Reliability
  | Security
  | Maintainability
  | Flexibility
  | Safety;

// Main categories
export type FunctionalSuitability = 
  | 'FunctionalSuitability.FunctionalCompleteness'
  | 'FunctionalSuitability.FunctionalCorrectness'
  | 'FunctionalSuitability.FunctionalAppropriateness';

export type PerformanceEfficiency = 
  | 'PerformanceEfficiency.TimeBehaviour'
  | 'PerformanceEfficiency.ResourceUtilization'
  | 'PerformanceEfficiency.Capacity'
  | 'PerformanceEfficiency.CoExistence';

export type Compatibility = 
  | 'Compatibility.Interoperability';

export type InteractionCapability = 
  | 'InteractionCapability.AppropriatenessRecognizability'
  | 'InteractionCapability.Learnability'
  | 'InteractionCapability.Operability'
  | 'InteractionCapability.UserErrorProtection'
  | 'InteractionCapability.UserEngagement'
  | 'InteractionCapability.Inclusivity'
  | 'InteractionCapability.UserAssistance'
  | 'InteractionCapability.SelfDescriptiveness';

export type Reliability = 
  | 'Reliability.Faultlessness'
  | 'Reliability.Availability'
  | 'Reliability.FaultTolerance'
  | 'Reliability.Recoverability';

export type Security = 
  | 'Security.Confidentiality'
  | 'Security.Integrity'
  | 'Security.NonRepudiation'
  | 'Security.Accountability'
  | 'Security.Authenticity'
  | 'Security.Resistance';

export type Maintainability = 
  | 'Maintainability.Modularity'
  | 'Maintainability.Reusability'
  | 'Maintainability.Analysability'
  | 'Maintainability.Modifiability'
  | 'Maintainability.Testability';

export type Flexibility = 
  | 'Flexibility.Adaptability'
  | 'Flexibility.Scalability'
  | 'Flexibility.Installability'
  | 'Flexibility.Replaceability';

export type Safety = 
  | 'Safety.OperationalConstraint'
  | 'Safety.RiskIdentification'
  | 'Safety.FailSafe'
  | 'Safety.HazardWarning'
  | 'Safety.SafeIntegration';

/**
 * Utility functions for quality categories
 */
export class QualityCategoryUtils {
  /**
   * Gets the main category from a full category string
   */
  static getMainCategory(category: QualityCategory): string {
    return category.split('.')[0];
  }

  /**
   * Gets the subcategory from a full category string
   */
  static getSubCategory(category: QualityCategory): string | null {
    const parts = category.split('.');
    return parts.length > 1 ? parts[1] : null;
  }

  /**
   * Checks if a category belongs to a specific main category
   */
  static isMainCategory(category: QualityCategory, mainCategory: string): boolean {
    return this.getMainCategory(category) === mainCategory;
  }
}

/**
 * Validation result types
 */
export interface ValidationError {
  message: string;
  position?: number;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Parser result types
 */
export interface ParseResult {
  success: boolean;
  program?: DSLProgram;
  errors: ValidationError[];
}

/**
 * DSL Token types for parsing
 */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
  line: number;
  column: number;
}

export type TokenType = 
  | 'KEYWORD_SYSTEM'
  | 'KEYWORD_ATTRIBUTE'
  | 'KEYWORD_ARTIFACT'
  | 'KEYWORD_CATEGORY'
  | 'KEYWORD_SOURCE'
  | 'KEYWORD_STIMULUS'
  | 'KEYWORD_ENVIRONMENT'
  | 'KEYWORD_RESPONSE'
  | 'KEYWORD_MEASURE'
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'LBRACE'
  | 'RBRACE'
  | 'COLON'
  | 'COMMA'
  | 'DOT'
  | 'EOF'
  | 'WHITESPACE'
  | 'UNKNOWN';

/**
 * AST Node types
 */
export interface ASTNode {
  type: ASTNodeType;
  position: number;
  children?: ASTNode[];
  value?: string;
}

export type ASTNodeType = 
  | 'Program'
  | 'SystemDeclaration'
  | 'AttributeDeclaration'
  | 'ArtifactDeclaration'
  | 'CategoryDeclaration'
  | 'ScenarioDeclaration'
  | 'SourceDeclaration'
  | 'StimulusDeclaration'
  | 'EnvironmentDeclaration'
  | 'ResponseDeclaration'
  | 'MeasureDeclaration'
  | 'Identifier'
  | 'StringLiteral'
  | 'CategoryLiteral';
