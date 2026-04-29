# Qify - Quality Attribute DSL

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

A Domain-Specific Language (DSL) for defining and validating quality attributes based on ISO 25010 standards, implemented in TypeScript.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Examples](#examples)
- [License](#license)

## Background

This DSL allows you to define quality attributes for systems using ISO 25010 categories, specify stimulus-response scenarios for quality requirements, validate semantic correctness and ISO 25010 compliance, and generate structured representations of quality specifications.

The system is built with TypeScript and provides:
- Complete ISO 25010 Support: All 8 main categories with valid subcategories
- Semantic Validation: Ensures required fields and correct category usage
- Extensible Grammar: Clean, readable syntax for quality specifications
- Multiple Output Formats: Text and JSON output options
- Error Reporting: Detailed validation errors and warnings
- Visualization: Canvas-based visualization of quality attributes

## Install

No external dependencies required. Just clone and run with Node.js 12+:

```bash
git clone https://github.com/LePeanutButter/qify
cd qify
```

## Usage

### Programmatic Usage

```typescript
import { DSLParser } from './src/core/domain/dsl/services/DSLParser';
import { ErrorHandler } from './src/core/shared/utils/error-handler';

// Parse DSL text
const dslText = `
system Ecommerce

attribute PerformanceCheckout {
  artifact: "CheckoutService"
  category: PerformanceEfficiency.TimeBehavior
  
  source: "external user"
  stimulus: "1000 concurrent users"
  environment: "peak hours"
  response: "response time < 2s"
  measure: "latency percentile p95"
}
`;

const parser = new DSLParser();
const result = parser.parseDSL(dslText);

if (result.errors.length > 0) {
    console.log("Parse errors:", result.errors);
} else {
    console.log("Valid DSL!");
    console.log("Program:", result.program);
}
```

## API

### DSLParser

The main parser class for processing DSL text.

```typescript
class DSLParser {
  parseDSL(dslText: string): ParseResult
  validateProgram(program: DSLProgram): ValidationResult
}
```

### ErrorHandler

Centralized error handling utility.

```typescript
class ErrorHandler {
  handleError(error: Error | string, context: ErrorContext, options?: ErrorOptions): AppError
  getErrorStats(): ErrorStats
}
```

### Logger

Structured logging utility.

```typescript
class Logger {
  debug(category: string, message: string, data?: unknown): void
  info(category: string, message: string, data?: unknown): void
  warn(category: string, message: string, data?: unknown): void
  error(category: string, message: string, error?: Error, data?: unknown): void
  fatal(category: string, message: string, error?: Error, data?: unknown): void
}
```

## Examples

### Basic DSL Example

```qify
system Ecommerce

attribute PerformanceCheckout {
  artifact: "CheckoutService"
  category: PerformanceEfficiency.TimeBehavior
  
  source: "external user"
  stimulus: "1000 concurrent users"
  environment: "peak hours"
  response: "response time < 2s"
  measure: "latency percentile p95"
}
```

### Complete DSL Example

```qify
system Ecommerce

attribute PerformanceCheckout {
  artifact: "CheckoutService"
  category: PerformanceEfficiency.TimeBehavior
  
  source: "external user"
  stimulus: "1000 concurrent users"
  environment: "peak hours"
  response: "response time < 2s"
  measure: "latency percentile p95"
}

attribute AvailabilityPayments {
  artifact: "PaymentGateway"
  category: Reliability.Availability
  
  source: "system monitoring"
  stimulus: "server failure"
  environment: "production"
  response: "failover in < 5s"
  measure: "downtime < 1%"
}
```

### ISO 25010 Categories

#### Functional Suitability
- `FunctionalCompleteness` - Degree to which the set of functions covers all specified tasks
- `FunctionalCorrectness` - Degree to which a product provides accurate results
- `FunctionalAppropriateness` - Degree to which functions facilitate task completion

#### Performance Efficiency
- `TimeBehaviour` - Degree to which response time and throughput meet requirements
- `ResourceUtilization` - Degree to which resource amounts and types meet requirements
- `Capacity` - Degree to which maximum limits of parameters meet requirements

#### Compatibility
- `CoExistence` - Degree to which product performs efficiently while sharing environment
- `Interoperability` - Degree to which system can exchange and use information

#### Interaction Capability
- `AppropriatenessRecognizability` - Degree to which users can recognize appropriateness
- `Learnability` - Degree to which functions can be learned within specified time
- `Operability` - Degree to which product has attributes that make it easy to operate
- `UserErrorProtection` - Degree to which system prevents operation errors
- `UserEngagement` - Degree to which interface encourages continued interaction
- `Inclusivity` - Degree to which product can be used by people of various backgrounds
- `UserAssistance` - Degree to which product can be used by widest range of users
- `SelfDescriptiveness` - Degree to which product presents appropriate information

#### Reliability
- `Faultlessness` - Degree to which system performs functions without fault
- `Availability` - Degree to which system is operational and accessible when required
- `FaultTolerance` - Degree to which system operates despite hardware/software faults
- `Recoverability` - Degree to which system can recover data and re-establish desired state

#### Security
- `Confidentiality` - Degree to which data are accessible only to authorized users
- `Integrity` - Degree to which system and data are protected from unauthorized modification
- `NonRepudiation` - Degree to which actions can be proven to have taken place
- `Accountability` - Degree to which actions can be traced uniquely to the entity
- `Authenticity` - Degree to which identity can be proved to be the one claimed
- `Resistance` - Degree to which product sustains operations while under attack

#### Maintainability
- `Modularity` - Degree to which system is composed of discrete components
- `Reusability` - Degree to which product can be used in more than one system
- `Analysability` - Degree to which impact of changes can be assessed effectively
- `Modifiability` - Degree to which product can be modified without introducing defects
- `Testability` - Degree to which test criteria can be established and tests performed

#### Flexibility
- `Adaptability` - Degree to which product can be adapted to different environments
- `Scalability` - Degree to which product can handle growing/shrinking workloads
- `Installability` - Degree to which product can be successfully installed/uninstalled
- `Replaceability` - Degree to which product can replace another for same purpose

#### Safety
- `OperationalConstraint` - Degree to which product constrains operation within safe parameters
- `RiskIdentification` - Degree to which product can identify unacceptable risks
- `FailSafe` - Degree to which product can place itself in safe operating mode
- `HazardWarning` - Degree to which product provides warnings of unacceptable risks
- `SafeIntegration` - Degree to which product maintains safety during integration

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`
5. Start development: `npm run dev`

### Architecture

```
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── dsl/
│   │   │   │   ├── entities/          # DSL entities and interfaces
│   │   │   │   └── services/          # DSL parsing and validation services
│   │   │   └── visualization/
│   │   │       ├── entities/          # Visualization entities
│   │   │       └── services/          # Visualization services
│   │   └── shared/
│   │       ├── utils/                 # Shared utilities (logger, error handler)
│   │       └── types/                 # Shared type definitions
│   ├── main.ts                        # Main entry point
│   └── test/                          # Test files
├── dist/                              # Compiled JavaScript output
├── package.json                       # Node.js package configuration
└── README.md                          # This documentation
```

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

### License Summary

- **Commercial Use**: Yes
- **Modification**: Yes
- **Distribution**: Yes
- **Private Use**: Yes
- **Liability**: No
- **Warranty**: No

### Copyright

© 2026 LePeanutButter. All rights reserved.
