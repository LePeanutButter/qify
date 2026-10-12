export type Language = 'en' | 'es' | 'de';
export type ExampleName = 'basic' | 'ecommerce' | 'healthcare' | 'iot';

type TranslationKey =
  | 'editor'
  | 'documentation'
  | 'examples'
  | 'basicExample'
  | 'ecommerceSystem'
  | 'healthcareSystem'
  | 'iotSystem'
  | 'liveVisualization'
  | 'documentationOverview'
  | 'documentationReference'
  | 'system'
  | 'activeAttribute'
  | 'isoCategory'
  | 'attribute'
  | 'source'
  | 'stimulus'
  | 'environment'
  | 'artifact'
  | 'response'
  | 'measure'
  | 'closeDocumentation'
  | 'qifyLead'
  | 'howToUse'
  | 'howToUseText'
  | 'basicStructure'
  | 'dslFields'
  | 'infoBox'
  | 'multipleDiagrams'
  | 'export'
  | 'categories'
  | 'licenseDeveloper'
  | 'infoBoxText'
  | 'multipleDiagramsText'
  | 'categoriesText'
  | 'licenseText'
  | 'fieldsText'
  | 'exportItems'
  | 'showInfoNotes'
  | 'validDsl'
  | 'downloadCode'
  | 'importCode'
  | 'accessibility'
  | 'lightMode'
  | 'highContrast'
  | 'largeText'
  | 'reducedMotion'
  | 'closeAccessibility'
  | 'desktopRequiredTitle'
  | 'desktopRequiredText'
  | 'desktopRequiredHint';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    editor: 'editor', documentation: 'documentation', examples: 'Examples',
    basicExample: 'Basic Example', ecommerceSystem: 'E-commerce System',
    healthcareSystem: 'Healthcare System', iotSystem: 'IoT System',
    liveVisualization: 'Live visualization', documentationOverview: 'DOCUMENTATION & OVERVIEW',
    documentationReference: 'Qify Studio reference', system: 'System',
    activeAttribute: 'Active attribute', isoCategory: 'ISO 25010 category',
    attribute: 'attribute', source: 'Source:', stimulus: 'Stimulus:',
    environment: 'Environment:', artifact: 'Artifact:', response: 'Response:',
    measure: 'Measures:', closeDocumentation: 'Close documentation',
    qifyLead: 'Visual DSL for documenting software quality attributes based on ISO 25010.',
    howToUse: 'How to use Qify',
    howToUseText: 'Write or import a .qify file in the editor on the left. The visualization updates automatically and shows an exportable SVG diagram for each defined attribute.',
    basicStructure: 'Basic structure', dslFields: 'DSL fields', infoBox: 'Information box',
    multipleDiagrams: 'Multiple diagrams', export: 'Export', categories: 'Supported categories',
    licenseDeveloper: 'License and developer', validDsl: 'Valid DSL!',
    downloadCode: 'Export .qify', importCode: 'Import .qify',
    infoBoxText: 'The optional diagram box can show the system, attribute, category, and modification date. Add showInfo inside the attribute block.',
    multipleDiagramsText: 'When you define several attribute blocks, Qify creates one diagram per attribute. Use the floating controls to navigate, zoom, and reset the view.',
    categoriesText: 'Includes ISO 25010 families such as FunctionalSuitability, PerformanceEfficiency, Compatibility, InteractionCapability, Reliability, Security, Maintainability, Flexibility, and Safety.',
    licenseText: 'License: GPL-3.0 license. Developer: LePeanutButter.',
    fieldsText: 'system: evaluated system. attribute: quality attribute or requirement. artifact: affected component, service, or module. category: ISO 25010 classification. source: stimulus origin. stimulus: triggering event. environment: execution context. response: expected behavior. measure: verifiable metric.',
    exportItems: 'Export PNG: raster image. Export SVG: pure SVG without foreignObject. Export PDF: selectable PDF. Download .qify: save the current DSL. Import .qify: load an existing DSL file.',
    showInfoNotes: 'You can also use showInfo: true. If omitted, the box stays hidden. With showInfo: false, it remains hidden.',
    accessibility: 'Accessibility', lightMode: 'Light mode', highContrast: 'High contrast',
    largeText: 'Large text', reducedMotion: 'Reduced motion', closeAccessibility: 'Close accessibility settings',
    desktopRequiredTitle: 'Qify Studio is designed for computers',
    desktopRequiredText: 'Please open Qify Studio from a desktop or laptop to use the editor, visual canvas, and export tools.',
    desktopRequiredHint: 'A larger screen is required for the best experience.'
  },
  es: {
    editor: 'editor', documentation: 'documentación', examples: 'Ejemplos',
    basicExample: 'Ejemplo básico', ecommerceSystem: 'Sistema e-commerce',
    healthcareSystem: 'Sistema de salud', iotSystem: 'Sistema IoT',
    liveVisualization: 'Visualización en vivo', documentationOverview: 'DOCUMENTACIÓN Y RESUMEN',
    documentationReference: 'Referencia de Qify Studio', system: 'Sistema',
    activeAttribute: 'Atributo activo', isoCategory: 'Categoría ISO 25010',
    attribute: 'atributo', source: 'Fuente:', stimulus: 'Estímulo:',
    environment: 'Entorno:', artifact: 'Artefacto:', response: 'Respuesta:',
    measure: 'Medidas:', closeDocumentation: 'Cerrar documentación',
    qifyLead: 'DSL visual para documentar atributos de calidad de software basados en ISO 25010.',
    howToUse: 'Cómo usar Qify',
    howToUseText: 'Escribe o importa un archivo .qify en el editor de la izquierda. La visualización se actualiza automáticamente y muestra un diagrama SVG exportable por cada atributo definido.',
    basicStructure: 'Estructura básica', dslFields: 'Campos del DSL', infoBox: 'Caja de información',
    multipleDiagrams: 'Varios diagramas', export: 'Exportación', categories: 'Categorías soportadas',
    licenseDeveloper: 'Licencia y desarrollador', validDsl: '¡DSL válido!',
    downloadCode: 'Exportar .qify', importCode: 'Importar .qify',
    infoBoxText: 'La caja opcional del diagrama puede mostrar el sistema, atributo, categoría y fecha de modificación. Agrega showInfo dentro del bloque attribute.',
    multipleDiagramsText: 'Si defines varios bloques attribute, Qify crea un diagrama por atributo. Usa los controles flotantes para navegar, hacer zoom y restablecer la vista.',
    categoriesText: 'Incluye familias ISO 25010 como FunctionalSuitability, PerformanceEfficiency, Compatibility, InteractionCapability, Reliability, Security, Maintainability, Flexibility y Safety.',
    licenseText: 'Licencia: GPL-3.0 license. Desarrollador: LePeanutButter.',
    fieldsText: 'system: sistema evaluado. attribute: atributo o requisito de calidad. artifact: componente, servicio o módulo afectado. category: clasificación ISO 25010. source: origen del estímulo. stimulus: evento disparador. environment: contexto de ejecución. response: comportamiento esperado. measure: métrica verificable.',
    exportItems: 'Export PNG: imagen rasterizada. Export SVG: SVG puro sin foreignObject. Export PDF: PDF seleccionable. Download .qify: guarda el DSL actual. Import .qify: carga un archivo DSL existente.',
    showInfoNotes: 'También puedes usar showInfo: true. Si se omite, la caja queda oculta. Con showInfo: false, permanece oculta.',
    accessibility: 'Accesibilidad', lightMode: 'Modo claro', highContrast: 'Alto contraste',
    largeText: 'Texto grande', reducedMotion: 'Movimiento reducido', closeAccessibility: 'Cerrar preferencias de accesibilidad',
    desktopRequiredTitle: 'Qify Studio está diseñado para computadores',
    desktopRequiredText: 'Abre Qify Studio desde un computador o portátil para usar el editor, el canvas visual y las herramientas de exportación.',
    desktopRequiredHint: 'Se requiere una pantalla más grande para disfrutar la mejor experiencia.'
  },
  de: {
    editor: 'Editor', documentation: 'Dokumentation', examples: 'Beispiele',
    basicExample: 'Grundbeispiel', ecommerceSystem: 'E-Commerce-System',
    healthcareSystem: 'Gesundheitssystem', iotSystem: 'IoT-System',
    liveVisualization: 'Live-Visualisierung', documentationOverview: 'DOKUMENTATION & ÜBERSICHT',
    documentationReference: 'Qify Studio Referenz', system: 'System',
    activeAttribute: 'Aktives Attribut', isoCategory: 'ISO-25010-Kategorie',
    attribute: 'Attribut', source: 'Quelle:', stimulus: 'Stimulus:',
    environment: 'Umgebung:', artifact: 'Artefakt:', response: 'Antwort:',
    measure: 'Messwerte:', closeDocumentation: 'Dokumentation schließen',
    qifyLead: 'Visuelle DSL zur Dokumentation von Softwarequalitätsattributen nach ISO 25010.',
    howToUse: 'Qify verwenden',
    howToUseText: 'Schreibe oder importiere eine .qify-Datei im Editor links. Die Visualisierung wird automatisch aktualisiert und zeigt für jedes definierte Attribut ein exportierbares SVG-Diagramm.',
    basicStructure: 'Grundstruktur', dslFields: 'DSL-Felder', infoBox: 'Infobox',
    multipleDiagrams: 'Mehrere Diagramme', export: 'Export', categories: 'Unterstützte Kategorien',
    licenseDeveloper: 'Lizenz und Entwickler', validDsl: 'Gültige DSL!',
    downloadCode: 'Exportieren .qify', importCode: 'Importieren .qify',
    infoBoxText: 'Die optionale Diagrammbox kann System, Attribut, Kategorie und Änderungsdatum anzeigen. Füge showInfo in den attribute-Block ein.',
    multipleDiagramsText: 'Bei mehreren attribute-Blöcken erstellt Qify ein Diagramm pro Attribut. Verwende die schwebenden Steuerelemente zum Navigieren, Zoomen und Zurücksetzen.',
    categoriesText: 'Enthält ISO-25010-Familien wie FunctionalSuitability, PerformanceEfficiency, Compatibility, InteractionCapability, Reliability, Security, Maintainability, Flexibility und Safety.',
    licenseText: 'Lizenz: GPL-3.0 license. Entwickler: LePeanutButter.',
    fieldsText: 'system: bewertetes System. attribute: Qualitätsattribut oder Anforderung. artifact: betroffene Komponente, Dienst oder Modul. category: ISO-25010-Klassifikation. source: Stimulusquelle. stimulus: auslösendes Ereignis. environment: Ausführungskontext. response: erwartetes Verhalten. measure: überprüfbare Metrik.',
    exportItems: 'Export PNG: Rasterbild. Export SVG: reines SVG ohne foreignObject. Export PDF: auswählbares PDF. Download .qify: aktuelle DSL speichern. Import .qify: vorhandene DSL-Datei laden.',
    showInfoNotes: 'Du kannst auch showInfo: true verwenden. Ohne Angabe bleibt die Box verborgen. Mit showInfo: false bleibt sie ausgeblendet.',
    accessibility: 'Barrierefreiheit', lightMode: 'Heller Modus', highContrast: 'Hoher Kontrast',
    largeText: 'Großer Text', reducedMotion: 'Weniger Bewegung', closeAccessibility: 'Barrierefreiheit schließen',
    desktopRequiredTitle: 'Qify Studio ist für Computer konzipiert',
    desktopRequiredText: 'Öffne Qify Studio auf einem Desktop-Computer oder Laptop, um Editor, Visualisierung und Exportwerkzeuge zu nutzen.',
    desktopRequiredHint: 'Für die beste Erfahrung wird ein größerer Bildschirm benötigt.'
  }
};

let currentLanguage: Language = 'en';
const listeners = new Set<(language: Language) => void>();

export function translate(key: TranslationKey): string {
  return translations[currentLanguage][key];
}

export function getDiagramLabels(): Record<'artifact' | 'source' | 'stimulus' | 'environment' | 'response' | 'measure', string> {
  return {
    artifact: translate('artifact'),
    source: translate('source'),
    stimulus: translate('stimulus'),
    environment: translate('environment'),
    response: translate('response'),
    measure: translate('measure')
  };
}

export function translateExample(exampleName: ExampleName, source: string): string {
  if (currentLanguage === 'en') return source;

  const replacements: Record<Exclude<Language, 'en'>, Record<ExampleName, Array<[string, string]>>> = {
    es: {
      basic: [['Ecommerce', 'Comercio'], ['PerformanceCheckout', 'RendimientoCheckout'], ['CheckoutService', 'ServicioCheckout'], ['external user', 'usuario externo'], ['1000 concurrent users', '1000 usuarios concurrentes'], ['peak hours', 'horas pico'], ['response time < 2s', 'tiempo de respuesta < 2s'], ['latency percentile p95', 'percentil de latencia p95']],
      ecommerce: [['EcommercePlatform', 'PlataformaComercio'], ['CheckoutPerformance', 'RendimientoCheckout'], ['DataIntegrity', 'IntegridadDatos'], ['CheckoutService', 'ServicioCheckout'], ['PaymentGateway', 'PasarelaPagos'], ['customer', 'cliente'], ['1000 concurrent checkout requests', '1000 solicitudes de compra concurrentes'], ['peak shopping season', 'temporada alta de compras'], ['complete checkout within 3 seconds', 'completar compra en 3 segundos'], ['95th percentile response time', 'tiempo de respuesta del percentil 95'], ['payment processor', 'procesador de pagos'], ['transaction processing', 'procesamiento de transacciones'], ['normal operations', 'operaciones normales'], ['encrypted data transmission', 'transmisión de datos cifrada'], ['AES-256 encryption standard', 'estándar de cifrado AES-256']],
      healthcare: [['HealthcareSystem', 'SistemaSalud'], ['PatientDataAvailability', 'DisponibilidadDatosPaciente'], ['UsabilityForClinicians', 'UsabilidadClinicos'], ['ElectronicHealthRecord', 'HistoriaClinicaElectronica'], ['PatientDashboard', 'PanelPaciente'], ['medical staff', 'personal médico'], ['emergency patient access', 'acceso de emergencia del paciente'], ['24/7 operations', 'operaciones 24/7'], ['system uptime 99.99%', 'disponibilidad del sistema 99.99%'], ['monthly availability percentage', 'porcentaje mensual de disponibilidad'], ['healthcare providers', 'proveedores de salud'], ['patient data entry', 'ingreso de datos del paciente'], ['clinical workflow', 'flujo de trabajo clínico'], ['complete records in < 2 minutes', 'completar registros en < 2 minutos'], ['average task completion time', 'tiempo promedio de finalización']],
      iot: [['IoTMonitoring', 'MonitoreoIoT'], ['RealTimeProcessing', 'ProcesamientoTiempoReal'], ['Scalability', 'Escalabilidad'], ['DataProcessor', 'ProcesadorDatos'], ['CloudInfrastructure', 'InfraestructuraNube'], ['sensor network', 'red de sensores'], ['10,000 concurrent data streams', '10.000 flujos de datos concurrentes'], ['normal operations', 'operaciones normales'], ['process data within 100ms', 'procesar datos en 100 ms'], ['end-to-end latency', 'latencia de extremo a extremo'], ['system administrator', 'administrador del sistema'], ['100% sensor growth', 'crecimiento de sensores del 100%'], ['peak usage', 'uso pico'], ['auto-scale within 5 minutes', 'autoescalar en 5 minutos'], ['horizontal scaling time', 'tiempo de escalado horizontal']]
    },
    de: {
      basic: [['Ecommerce', 'ECommerce'], ['PerformanceCheckout', 'CheckoutLeistung'], ['CheckoutService', 'CheckoutDienst'], ['external user', 'externer Benutzer'], ['1000 concurrent users', '1000 gleichzeitige Benutzer'], ['peak hours', 'Stoßzeiten'], ['response time < 2s', 'Antwortzeit < 2 s'], ['latency percentile p95', 'Latenzperzentil p95']],
      ecommerce: [['EcommercePlatform', 'E-CommercePlattform'], ['CheckoutPerformance', 'CheckoutLeistung'], ['DataIntegrity', 'Datenintegrität'], ['CheckoutService', 'CheckoutDienst'], ['PaymentGateway', 'Zahlungsgateway'], ['customer', 'Kunde'], ['1000 concurrent checkout requests', '1000 gleichzeitige Checkout-Anfragen'], ['peak shopping season', 'Hauptsaison'], ['complete checkout within 3 seconds', 'Checkout innerhalb von 3 Sekunden abschließen'], ['95th percentile response time', 'Antwortzeit des 95. Perzentils'], ['payment processor', 'Zahlungsprozessor'], ['transaction processing', 'Transaktionsverarbeitung'], ['normal operations', 'Normalbetrieb'], ['encrypted data transmission', 'verschlüsselte Datenübertragung'], ['AES-256 encryption standard', 'AES-256-Verschlüsselungsstandard']],
      healthcare: [['HealthcareSystem', 'Gesundheitssystem'], ['PatientDataAvailability', 'Patientendatenverfügbarkeit'], ['UsabilityForClinicians', 'BenutzbarkeitFuerAerzte'], ['ElectronicHealthRecord', 'ElektronischePatientenakte'], ['PatientDashboard', 'PatientenDashboard'], ['medical staff', 'medizinisches Personal'], ['emergency patient access', 'Notfallzugriff auf Patientendaten'], ['24/7 operations', '24/7-Betrieb'], ['system uptime 99.99%', 'Systemverfügbarkeit 99,99%'], ['monthly availability percentage', 'monatlicher Verfügbarkeitsprozentsatz'], ['healthcare providers', 'Gesundheitsdienstleister'], ['patient data entry', 'Patientendateneingabe'], ['clinical workflow', 'klinischer Arbeitsablauf'], ['complete records in < 2 minutes', 'Datensätze in < 2 Minuten vervollständigen'], ['average task completion time', 'durchschnittliche Aufgabenerledigungszeit']],
      iot: [['IoTMonitoring', 'IoTUeberwachung'], ['RealTimeProcessing', 'Echtzeitverarbeitung'], ['Scalability', 'Skalierbarkeit'], ['DataProcessor', 'Datenprozessor'], ['CloudInfrastructure', 'CloudInfrastruktur'], ['sensor network', 'Sensornetzwerk'], ['10,000 concurrent data streams', '10.000 gleichzeitige Datenströme'], ['normal operations', 'Normalbetrieb'], ['process data within 100ms', 'Daten innerhalb von 100 ms verarbeiten'], ['end-to-end latency', 'Ende-zu-Ende-Latenz'], ['system administrator', 'Systemadministrator'], ['100% sensor growth', '100% Sensorwachstum'], ['peak usage', 'Spitzennutzung'], ['auto-scale within 5 minutes', 'innerhalb von 5 Minuten automatisch skalieren'], ['horizontal scaling time', 'horizontale Skalierungszeit']]
    }
  };

  return (replacements[currentLanguage][exampleName] ?? []).reduce(
    (text, [from, to]) => text.replaceAll(from, to),
    source
  );
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element => {
    const key = element.dataset['i18n'] as TranslationKey | undefined;
    if (key) element.textContent = translate(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach(element => {
    const key = element.dataset['i18nAriaLabel'] as TranslationKey | undefined;
    if (key) element.setAttribute('aria-label', translate(key));
  });
  listeners.forEach(listener => listener(language));
}

export function onLanguageChange(listener: (language: Language) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
