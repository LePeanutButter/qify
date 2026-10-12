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
  category: InteractionCapability.Operability,
  
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
}`,

  smartrip: `// PROYECTO: SmarTrip - Especificación de Atributos de Calidad (ASRs)
// TOOL/DSL: Arquitecture Specification DSL (AS-DSL)
//
// DESCRIPCIÓN:
// Este archivo define los Atributos de Calidad clave para el sistema SmarTrip,
// modelados a través de escenarios formales que detallan el artefacto, la
// categoría taxonómica, la fuente, el estímulo, el entorno, la respuesta
// esperada y las métricas de medición arquitectónica.
//
// AUTORES:
// * Andrés Felipe Calderón Ramírez - AndresFelipeCalderonRamirez
// * Daniel Esteban Rodríguez Suarez - ders14028-bit
// * Juan Pablo Salamanca Mojica - juan-pablo-salamanca-mojica-017855382
// * Juana Lozano Chaves - juanalch
// * Laura Natalia Perilla Quintero - Lanapequin
// * Laura Alejandra Venegas Piraban - LauraVenegas6
// * Ricardo Andres Ayala Garzon - lRicardol
// * Santiago Amaya Zapata - SantiagoAmaya21
// * Santiago Botero Garcia - LePeanutButter
// * Sofia Velandia Cifuentes - sofía-velandia-cifuentes-4b4aa51a4
//
// FECHA DE CREACIÓN: Abril 21, 2026
// ÚLTIMA MODIFICACIÓN: Mayo 9, 2026
// REPOSITORIO OFICIAL: https://github.com/LePeanutButter/overtheair-docs.git

system SmarTrip

attribute DisponibilidadContinuidadServicio {
  artifact: "Sistema de balanceo de carga y servidores redundantes",
  category: Reliability.Availability,
  source: "Usuarios finales y equipo de operaciones",
  stimulus: "Fallo inesperado de un servidor de procesamiento",
  environment: "Operación normal del servicio en entorno cloud",
  response: "Detección automática del fallo y redistribución del tráfico a servidores saludables",
  measure: "Tiempo máximo de interrupción por servicio inferior a 5 minutos; disponibilidad del servicio superior al 99.5%; capacidad de atender hasta 3 instancias simultáneas por servicio"
}

attribute EscalabilidadCrecimientoNegocio {
  artifact: "Sistema de escalado automático de servidores",
  category: Flexibility.Scalability,
  source: "Aumento natural de usuarios y transacciones",
  stimulus: "Incremento sostenido de la demanda del servicio",
  environment: "Operación comercial con picos de demanda estacional",
  response: "Adición automática de capacidad de procesamiento según la demanda",
  measure: "Capacidad de escalar entre 1-3 servidores para el servicio principal y 1-2 para inteligencia artificial; utilización de CPU mantenida entre 20-70%; procesamiento de hasta 100 eventos pendientes en cola"
}

attribute RendimientoAltaDemanda {
  artifact: "Sistema de procesamiento y colas de trabajo asíncrono",
  category: PerformanceEfficiency.TimeBehaviour,
  source: "Usuarios interactuando con la plataforma",
  stimulus: "Picos de actividad simultánea en el sistema",
  environment: "Operación con recursos optimizados para costos",
  response: "Mantenimiento del servicio con degradación controlada del rendimiento",
  measure: "Tiempo de respuesta percentil 95 inferior a 2 segundos; procesamiento de eventos sin pérdida de datos; ausencia de errores críticos sostenidos"
}

attribute SeguridadControlAcceso {
  artifact: "Sistema de autenticación y control de permisos",
  category: Security.Confidentiality,
  source: "Usuarios y clientes de la plataforma",
  stimulus: "Intentos de acceso no autorizado a funcionalidades protegidas",
  environment: "Operación normal con autenticación requerida",
  response: "Bloqueo inmediato de accesos no autorizados con registro del incidente",
  measure: "Tasa de accesos bloqueados del 100% para credenciales inválidas; tiempo de sesión seguro configurado según política; cero operaciones no autorizadas persistidas"
}

attribute SeguridadInfraestructura {
  artifact: "Sistema de protección de red y filtrado de tráfico",
  category: Security.Resistance,
  source: "Tráfico externo desde Internet",
  stimulus: "Intentos de acceso directo a componentes internos",
  environment: "Entorno de producción con red aislada",
  response: "Bloqueo de accesos no autorizados y enrutamiento seguro del tráfico",
  measure: "Cero accesos directos a bases de datos desde Internet; todo el tráfico encriptado; puertos de gestión restringidos según política"
}

attribute SeguridadDespliegue {
  artifact: "Sistema automatizado de análisis de seguridad",
  category: Security.Integrity,
  source: "Equipo de desarrollo realizando cambios",
  stimulus: "Incorporación de código con vulnerabilidades o dependencias inseguras",
  environment: "Proceso de desarrollo e integración continua",
  response: "Bloqueo automático del despliegue si se detectan vulnerabilidades críticas",
  measure: "Cero despliegues con vulnerabilidades críticas/altas; tiempo de detección de problemas inferior a 10 minutos; correlación de hallazgos con correcciones aplicadas"
}

attribute MonitoreoGestionOperativa {
  artifact: "Sistema de monitoreo centralizado y alertas automáticas",
  category: Reliability.Faultlessness,
  source: "Equipo de operaciones y soporte técnico",
  stimulus: "Incidentes de rendimiento o errores del sistema",
  environment: "Operación continua con supervisión activa",
  response: "Detección inmediata de anomalías y notificación al equipo responsable",
  measure: "Tiempo de detección de incidentes inferior a 1 minuto; cobertura de monitoreo del 100% de servicios; tiempo medio de recuperación operativa documentado"
}

attribute FiabilidadProcesamientoAsincrono {
  artifact: "Sistema de mensajería garantizada",
  category: Reliability.FaultTolerance,
  source: "Sistema generando eventos de negocio",
  stimulus: "Volumen variable de eventos procesados en cola",
  environment: "Operación con posibles demoras temporales",
  response: "Retención y procesamiento garantizado de todos los eventos",
  measure: "Profundidad de cola controlada bajo 100 eventos; retención de mensajes hasta 14 días; tasa de procesamiento exitoso superior al 99%"
}

attribute MantenibilidadEvolucionSistema {
  artifact: "Arquitectura modular con componentes independientes",
  category: Maintainability.Modularity,
  source: "Equipo de desarrollo implementando mejoras",
  stimulus: "Cambios funcionales o ajustes de negocio",
  environment: "Desarrollo evolutivo con múltiples componentes",
  response: "Implementación de cambios sin afectar todo el sistema",
  measure: "Impacto del cambio limitado a componentes específicos; calidad de código mantenida según estándares; tiempo de compilación por componente optimizado"
}

attribute CompatibilidadIntegracion {
  artifact: "Interfaces estandarizadas y documentadas",
  category: Compatibility.Interoperability,
  source: "Aplicaciones cliente consumiendo servicios",
  stimulus: "Interacción entre diferentes componentes del sistema",
  environment: "Operación con múltiples clientes y servicios",
  response: "Comunicación confiable entre componentes con intercambio de datos estructurado",
  measure: "Tasa de errores de integración inferior al 1%; compatibilidad verificada con pruebas; versionado controlado de interfaces"
}

attribute DesplieguePortabilidad {
  artifact: "Sistema de infraestructura como código",
  category: Flexibility.Installability,
  source: "Equipo de plataforma gestionando infraestructura",
  stimulus: "Creación o recreación de entornos de operación",
  environment: "Proceso de despliegue automatizado",
  response: "Creación reproducible de entornos completos de operación",
  measure: "Tiempo de despliegue completo inferior a 2 horas; automatización del 95% de los pasos; consistencia garantizada entre entornos"
}

attribute IntegridadRecuperacionDatos {
  artifact: "Sistema de respaldo y recuperación gestionado",
  category: Security.Integrity,
  source: "Operaciones de mantenimiento o incidentes",
  stimulus: "Pérdida de datos o necesidad de restauración",
  environment: "Operación con copias de seguridad automáticas",
  response: "Restauración completa del estado anterior a un incidente",
  measure: "Ventana de recuperación de 7 días; tiempo de restauración proporcional al volumen de datos; integridad verificada tras recuperación"
}

attribute ExperienciaUsuarioMovil {
  artifact: "Sistema de almacenamiento local y sincronización inteligente",
  category: InteractionCapability.Operability,
  source: "Viajeros utilizando la aplicación móvil",
  stimulus: "Condiciones variables de conectividad a red",
  environment: "Operación móvil con conectividad limitada",
  response: "Funcionalidad continua con datos recientes disponibles localmente",
  measure: "Tiempo de carga de pantallas clave inferior a 1 segundo con datos locales; tasa de recuperación ante interrupciones superior al 95%; experiencia sin bloqueos de interfaz"
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
  'FunctionalSuitability.FunctionalCompleteness',
  'FunctionalSuitability.FunctionalCorrectness',
  'FunctionalSuitability.FunctionalAppropriateness',
  'PerformanceEfficiency.TimeBehaviour',
  'PerformanceEfficiency.ResourceUtilization',
  'PerformanceEfficiency.Capacity',
  'PerformanceEfficiency.CoExistence',
  'Compatibility.Interoperability',
  'InteractionCapability.AppropriatenessRecognizability',
  'InteractionCapability.Learnability',
  'InteractionCapability.Operability',
  'InteractionCapability.UserErrorProtection',
  'InteractionCapability.UserEngagement',
  'InteractionCapability.Inclusivity',
  'InteractionCapability.UserAssistance',
  'InteractionCapability.SelfDescriptiveness',
  'Reliability.Faultlessness',
  'Reliability.Availability',
  'Reliability.FaultTolerance',
  'Reliability.Recoverability',
  'Security.Confidentiality',
  'Security.Integrity',
  'Security.NonRepudiation',
  'Security.Accountability',
  'Security.Authenticity',
  'Security.Resistance',
  'Maintainability.Modularity',
  'Maintainability.Reusability',
  'Maintainability.Analysability',
  'Maintainability.Modifiability',
  'Maintainability.Testability',
  'Flexibility.Adaptability',
  'Flexibility.Scalability',
  'Flexibility.Installability',
  'Flexibility.Replaceability',
  'Safety.OperationalConstraint',
  'Safety.RiskIdentification',
  'Safety.FailSafe',
  'Safety.HazardWarning',
  'Safety.SafeIntegration'
];
