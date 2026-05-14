/**
 * Example DSL templates for the IDE
 */
export const EXAMPLES = {
  basic: `system Ecommerce

attribute PerformanceCheckout {
  artifact: "CheckoutService",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "external user",
  stimulus: "1000 concurrent users",
  environment: "peak hours",
  response: "response time < 2s",
  measure: "latency percentile p95"
}`,

  ecommerce: `system EcommercePlatform

attribute CheckoutPerformance {
  artifact: "CheckoutService",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "customer",
  stimulus: "1000 concurrent checkout requests",
  environment: "peak shopping season",
  response: "complete checkout within 3 seconds",
  measure: "95th percentile response time"
}

attribute DataIntegrity {
  artifact: "PaymentGateway",
  category: Security.Integrity,
  
  source: "payment processor",
  stimulus: "transaction processing",
  environment: "normal operations",
  response: "encrypted data transmission",
  measure: "AES-256 encryption standard"
}`,

  healthcare: `system HealthcareSystem

attribute PatientDataAvailability {
  artifact: "ElectronicHealthRecord",
  category: Reliability.Availability,
  
  source: "medical staff",
  stimulus: "emergency patient access",
  environment: "24/7 operations",
  response: "system uptime 99.99%",
  measure: "monthly availability percentage"
}

attribute UsabilityForClinicians {
  artifact: "PatientDashboard",
  category: Usability.Operability,
  
  source: "healthcare providers",
  stimulus: "patient data entry",
  environment: "clinical workflow",
  response: "complete records in < 2 minutes",
  measure: "average task completion time"
}`,

  iot: `system IoTMonitoring

attribute RealTimeProcessing {
  artifact: "DataProcessor",
  category: PerformanceEfficiency.TimeBehaviour,
  
  source: "sensor network",
  stimulus: "10,000 concurrent data streams",
  environment: "normal operations",
  response: "process data within 100ms",
  measure: "end-to-end latency"
}

attribute Scalability {
  artifact: "CloudInfrastructure",
  category: PerformanceEfficiency.Capacity,
  
  source: "system administrator",
  stimulus: "100% sensor growth",
  environment: "peak usage",
  response: "auto-scale within 5 minutes",
  measure: "horizontal scaling time"
}`
};

/**
 * DSL Keywords for syntax highlighting
 */
export const KEYWORDS = [
  'system', 
  'attribute', 
  'artifact', 
  'category', 
  'source', 
  'stimulus', 
  'environment', 
  'response', 
  'measure', 
  'showInfo'
];

/**
 * DSL Categories for syntax highlighting
 */
export const CATEGORIES = [
  'PerformanceEfficiency.TimeBehaviour',
  'PerformanceEfficiency.ResourceUtilization',
  'PerformanceEfficiency.Capacity',
  'Reliability.Maturity',
  'Reliability.Availability',
  'Reliability.FaultTolerance',
  'Reliability.Recoverability',
  'Usability.Understandability',
  'Usability.Learnability',
  'Usability.Operability',
  'Usability.UserErrorProtection',
  'Usability.Accessibility',
  'Usability.UserInterfaceAesthetics',
  'Security.Confidentiality',
  'Security.Integrity',
  'Security.NonRepudiation',
  'Security.Accountability',
  'Security.Authenticatic',
  'Compatibility.Coexistence',
  'Compatibility.Interoperability',
  'Maintainability.Modularity',
  'Maintainability.Reusability',
  'Maintainability.Analyzability',
  'Maintainability.Modifiability',
  'Maintainability.Testability'
];
