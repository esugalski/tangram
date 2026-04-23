/**
 * seed-demo.js — Pre-populate localStorage with a comprehensive demo
 * project so a first-time Guided-mode user can walk the journey by just
 * clicking "Next" through each step and see every module with realistic
 * sample content.
 *
 * Company: Tangram MedTech  ·  Device: CardioSync Pro  (Class II cardiac monitor)
 *
 * Public API:
 *   SeedDemo.seed()        - populate all keys (idempotent per key; won't overwrite existing)
 *   SeedDemo.seedForce()   - wipe & re-seed
 *   SeedDemo.isSeeded()    - true if qms_demo_seeded flag set
 */

const SeedDemo = (function () {
  'use strict';

  const FLAG = 'qms_demo_seeded';

  // ── SEED DATA ────────────────────────────────────────────────────────

  const SEEDS = {
    // Company / project identity
    qms_context: {
      companyName: 'Tangram MedTech',
      companySize: 'small',
      companyStage: 'pre-sub',
      regulatoryMarkets: ['us', 'eu'],
      deviceName: 'CardioSync Pro',
      deviceClass: 'ii',
      deviceType: 'combination',
      intendedUse: 'Continuous ambulatory monitoring and detection of cardiac arrhythmia events in adult patients, with secure transmission of diagnostic data to clinicians via a paired mobile app.',
      patientPopulation: 'Adult patients (≥18 years) with diagnosed or suspected cardiac arrhythmia.',
      scopeActivities: ['design', 'manufacturing', 'post-market'],
      knownExclusions: '§7.5.7 (excluded — no sterile manufacturing)',
      regulatoryBasis: 'ISO 13485:2016; 21 CFR Part 820; EU MDR 2017/745',
      setupComplete: true,
      setupDate: new Date().toISOString(),
    },

    qms_settings: {
      companyName: 'Tangram MedTech',
      projectName: 'CardioSync Pro',
      logoDataUrl: null,
      footerText: 'CONFIDENTIAL — For Internal Use Only',
      deviceDescription: 'Wearable cardiac monitor with paired mobile app for arrhythmia detection.',
      apiKey: '',
    },

    // User Needs document header (step 3)
    qms_un_meta: {
      revision: 'A',
      status: 'approved',
      effectiveDate: '2026-01-15',
      intendedUse: 'The CardioSync Pro is intended for continuous, ambulatory monitoring and detection of cardiac arrhythmia events in adult patients, with secure transmission of diagnostic data to clinicians via a paired mobile app.',
      indicationsForUse: 'Adult patients (≥18 years) with diagnosed or suspected cardiac arrhythmia requiring extended ambulatory ECG monitoring in outpatient settings.',
      patientPopulation: 'Adult patients with chronic or paroxysmal arrhythmia',
      intendedUser: 'clinician',
      useEnvironment: 'Outpatient + home ambulatory use',
    },

    // Design Inputs document header (step 5)
    qms_di_meta: {
      revision: 'B',
      status: 'review',
      effectiveDate: '2026-02-01',
      diScope: 'Design inputs for CardioSync Pro Rev A — all functional, performance, safety, and regulatory requirements derived from user needs + risk controls.',
      diBasis: 'ISO 13485 §7.3.3; FDA 21 CFR 820.30(c); ISO 14971 §7.1 (risk control inputs)',
      applicableStandards: 'ISO 13485:2016; ISO 14971:2019; IEC 62304; IEC 60601-1; IEC 60601-1-2; ISO 10993-1',
      refUserNeeds: 'UN-001 through UN-005',
      refRiskMgmt: 'RM-PLAN-001; Hazard Analysis TR-HA-001',
    },

    // Design Outputs document header (step 7)
    qms_do_meta: {
      revision: 'A',
      status: 'review',
      effectiveDate: '2026-03-15',
      outputTypes: 'Mechanical drawings, PCB schematics, firmware source, mobile app source, labels, IFU, packaging artwork',
      approvalBasis: 'Approved when output traces to ≥1 design input AND passes design review per 820.30(e).',
      deviceClass: 'ii',
      refDesignInputs: 'DI-001 through DI-007',
      applicableStandards: 'ISO 13485 §7.3.4; FDA 21 CFR 820.30(d); IEC 62304 (software outputs)',
    },

    // Step 2 — Regulatory assessment
    qms_regulatory_assessment: {
      deviceName: 'CardioSync Pro',
      productType: 'Wearable / body-worn',
      clinicalUse: 'Monitoring',
      intendedUse: 'Continuous ambulatory monitoring and detection of arrhythmia events in adult patients.',
      fdaClass: 'II',
      productCode: 'DQK',
      cfr: '21 CFR 870.2300',
      pathway: '510k',
      predicates: [
        { k: 'K221456', mfr: 'ContinuCardio Inc.', name: 'CardioWatch 3 Monitor', year: '2022' },
      ],
      euClass: 'Class IIa',
      euRule: 'Rule 10',
      euNb: 'BSI (2797)',
      euRoute: 'Annex IX — Full quality + technical file review',
      standards: [
        { name: 'ISO 13485:2016' }, { name: 'ISO 14971:2019' },
        { name: 'IEC 62304' }, { name: 'IEC 60601-1' },
        { name: 'IEC 60601-1-2' }, { name: 'ISO 10993-1' },
        { name: 'IEC 62366-1' }, { name: 'ISO 15223-1' },
      ],
      markets: ['United States', 'European Union', 'Canada'],
      narrative: 'CardioSync Pro is a Class II cardiac monitor pursuing US market clearance via the 510(k) pathway, with CardioWatch 3 Monitor (K221456) as the chosen predicate. Substantial equivalence claim rests on shared intended use (ambulatory arrhythmia monitoring), technology (single-lead ECG + BLE), and performance range. EU market launch will follow via MDR Annex IX route, Class IIa under Rule 10 (active medical device for monitoring). Clinical evaluation will leverage predicate literature plus a ≥200-subject real-world performance study.',
      wizardAnswers: { contact: 'Skin only', energy: 'Measures only', software: 'Software-driven hardware' },
    },

    // Step 4 — Development plan
    qms_dev_plan: {
      project: 'CardioSync Pro Rev A',
      pm: 'Sam Patel · Director of Product',
      version: '1.2',
      objective: 'Design and release CardioSync Pro — a Class II wearable cardiac monitor cleared under 510(k) and CE-marked under MDR — meeting the 2026 Q3 commercial launch target.',
      success: '510(k) cleared by end of Q2 2026; CE mark by end of Q3 2026; first commercial shipment Q4 2026.',
      cadence: 'Monthly core team review + phase-gate',
      reviewNotes: 'Cross-functional (R&D, QA, RA, Clinical, Ops) attend phase gates. Independent reviewer rotation per 820.30(e).',
      phases: [
        { id:'planning', label:'Planning', blurb:'Scope, classification, plan, risk plan.',
          start:'2025-10-01', end:'2025-11-30', exit:'Regulatory strategy + dev plan approved.',
          deliverables: [
            { name:'Regulatory assessment', owner:'RA Lead', status:'done' },
            { name:'Development plan approved', owner:'PM', status:'done' },
            { name:'Risk management plan', owner:'RA Lead', status:'done' },
          ]
        },
        { id:'inputs', label:'Design Inputs', blurb:'User needs, design inputs, initial risk.',
          start:'2025-12-01', end:'2026-01-31', exit:'Design inputs baseline approved.',
          deliverables: [
            { name:'User needs captured & reviewed', owner:'Product', status:'done' },
            { name:'Design inputs approved', owner:'R&D Lead', status:'in-progress' },
            { name:'Hazard analysis / initial FMEA', owner:'RA Lead', status:'in-progress' },
          ]
        },
        { id:'outputs', label:'Design Outputs', blurb:'Specs, drawings, firmware, labels.',
          start:'2026-02-01', end:'2026-03-31', exit:'All outputs traced to inputs; DMR assembled.',
          deliverables: [
            { name:'Design output documents (specs, drawings)', owner:'R&D', status:'pending' },
            { name:'Labels & IFU drafted', owner:'RA', status:'pending' },
            { name:'Traceability matrix updated', owner:'QA', status:'pending' },
          ]
        },
        { id:'verification', label:'Verification', blurb:'Testing outputs vs inputs.',
          start:'2026-04-01', end:'2026-05-15', exit:'V&V master plan and protocols complete.',
          deliverables: [
            { name:'V&V master plan', owner:'V&V Lead', status:'pending' },
            { name:'Design verification protocols & reports', owner:'V&V', status:'pending' },
          ]
        },
        { id:'validation', label:'Validation', blurb:'Real-world validation + HF.',
          start:'2026-05-15', end:'2026-06-30', exit:'Validation report approved.',
          deliverables: [
            { name:'Design validation protocols & reports', owner:'V&V Lead', status:'pending' },
            { name:'Human factors / usability summary', owner:'HFE Lead', status:'pending' },
          ]
        },
        { id:'transfer', label:'Design Transfer', blurb:'Production can build to spec.',
          start:'2026-07-01', end:'2026-08-31', exit:'First production lot released.',
          deliverables: [
            { name:'DMR assembled', owner:'Ops', status:'pending' },
            { name:'Production process validation (IQ/OQ/PQ)', owner:'Ops', status:'pending' },
          ]
        },
        { id:'postmarket', label:'Post-Market', blurb:'PMS plan + surveillance.',
          start:'2026-09-01', end:'', exit:'—',
          deliverables: [
            { name:'PMS plan & trending metrics', owner:'PMS Lead', status:'pending' },
            { name:'Complaint handling in place', owner:'QA', status:'pending' },
          ]
        },
      ],
      roles: [
        { role: 'Project manager', name: 'Sam Patel', scope: 'Schedule, cross-functional coordination, phase gates' },
        { role: 'R&D Lead', name: 'Jordan Kim', scope: 'Design inputs/outputs, verification strategy' },
        { role: 'Quality Assurance', name: 'Alex Reyes', scope: 'QMS conformance, document control, audits' },
        { role: 'Regulatory Affairs', name: 'Mira Chen', scope: 'Classification, pathway, submission' },
        { role: 'V&V Lead', name: 'Priya Shah', scope: 'Test protocols, reports, traceability' },
      ],
      signature: null,
    },

    // Step 6 — Risk register (ISO 14971)
    qms_risks: {
      'RISK-001': {
        id:'RISK-001',
        hazard:'High electrical energy',
        situation:'Housing seal degrades and the battery is exposed to skin moisture during normal wear.',
        harm:'Skin burn or electrocution',
        initialSeverity:4, initialProbability:2,
        controls:[
          { type:'inherent', desc:'Hermetic sealed enclosure with IP68 rating', impact:'Eliminates exposure of battery' },
          { type:'protective', desc:'Secondary moisture-detection cut-off circuit', impact:'Disables output if moisture detected' },
          { type:'info', desc:'User IFU warning about visible cracking', impact:'User discontinues use if damage visible' },
        ],
        residualSeverity:4, residualProbability:1,
        verification:'TR-045 environmental seal tests; TR-046 moisture cut-off verification.',
        notes:'', trace:'DI-007, DI-010'
      },
      'RISK-002': {
        id:'RISK-002',
        hazard:'Missed arrhythmia detection (false negative)',
        situation:'Detection algorithm fails to recognize a life-threatening VT event due to signal noise from patient motion.',
        harm:'Delay in treatment of life-threatening event',
        initialSeverity:5, initialProbability:3,
        controls:[
          { type:'inherent', desc:'Multi-lead signal fusion algorithm', impact:'Robust to single-channel noise' },
          { type:'protective', desc:'Uncertainty alert when signal quality drops', impact:'Clinician is notified to investigate' },
          { type:'info', desc:'IFU emphasizes the device is an adjunct, not sole source of diagnosis', impact:'User awareness' },
        ],
        residualSeverity:5, residualProbability:1,
        verification:'TR-050 algorithm sensitivity testing (98.7% sensitivity, 1.3% FPR); TR-051 signal-quality alert verification.',
        notes:'Further PMCF study to confirm real-world sensitivity post-launch.', trace:'DI-001, DI-012'
      },
      'RISK-003': {
        id:'RISK-003',
        hazard:'Unauthorized access to patient data',
        situation:'Attacker intercepts BLE transmission between device and phone app.',
        harm:'Loss of patient confidentiality / PHI exposure',
        initialSeverity:3, initialProbability:3,
        controls:[
          { type:'inherent', desc:'AES-256 end-to-end encryption', impact:'Intercepted data is unreadable' },
          { type:'protective', desc:'Device-phone pairing with 6-digit confirmation code', impact:'Prevents unauthorized pairing' },
        ],
        residualSeverity:3, residualProbability:1,
        verification:'TR-060 pen-test report; SW-003 cryptographic conformance evidence.',
        notes:'', trace:'DI-003'
      },
      'RISK-004': {
        id:'RISK-004',
        hazard:'Battery failure during critical monitoring window',
        situation:'Battery depletes faster than expected and the device stops recording.',
        harm:'Gap in arrhythmia monitoring coverage',
        initialSeverity:3, initialProbability:4,
        controls:[
          { type:'inherent', desc:'Over-spec battery (3.5yr vs 3yr requirement)', impact:'More headroom' },
          { type:'protective', desc:'App alerts user at 10% remaining capacity', impact:'User replaces/recharges in time' },
          { type:'info', desc:'IFU states typical replacement interval', impact:'User plans replacements' },
        ],
        residualSeverity:3, residualProbability:2,
        verification:'TR-070 accelerated battery life testing under physiological load.',
        notes:'', trace:'DI-002'
      },
    },

    qms_risk_plan: {
      scope: 'CardioSync Pro — full device lifecycle (design → post-market), adult patient use.',
      criteria: 'Score 1–4 = broadly acceptable; 5–14 = reduce as far as practicable; 15–25 = unacceptable without risk-benefit justification.',
      cycle: 'At every phase-gate review + annual + on design change + on new post-market signal.',
      resp: 'Risk owner: Mira Chen (RA Lead). Approvers: RA Lead, R&D Lead, QA Manager.',
    },

    // Step 9 — Design reviews
    qms_design_reviews: {
      'DR-001': {
        id: 'DR-001', title: 'Planning Phase Design Review',
        phase: 'planning', date: '2025-11-24', outcome: 'approved',
        notes: 'Plan, classification, risk plan reviewed. Approved to proceed to Inputs phase.',
        participants: [
          { name: 'Sam Patel', role: 'PM', independent: false },
          { name: 'Mira Chen', role: 'RA Lead', independent: false },
          { name: 'Alex Reyes', role: 'QA Manager', independent: true },
          { name: 'Dr. L. Torres', role: 'External clinical consultant', independent: true },
        ],
        status: 'closed',
        signature: { signerName: 'Alex Reyes', signerRole: 'QA Manager', timestamp: '2025-11-24T18:32:00Z', meaning: 'Approval' },
      },
    },

    // Step 10 — V&V
    qms_vv_items: {
      'DVER-001': {
        id:'DVER-001', kind:'verification',
        title:'Arrhythmia detection sensitivity',
        method:'Bench testing against MIT-BIH reference dataset',
        scope:'Firmware v0.4.2, hardware Rev A, signals from standard arrhythmia databases.',
        acceptance:'Sensitivity ≥98%, FPR ≤2%',
        testCases:[
          { id:'TC-01', criterion:'Sensitivity on MIT-BIH AFIB', expected:'≥98%', result:'pass' },
          { id:'TC-02', criterion:'FPR on MIT-BIH NSR', expected:'≤2%', result:'pass' },
          { id:'TC-03', criterion:'Sensitivity on AHA DB (VT)', expected:'≥98%', result:'pending' },
        ],
        executionStatus:'in-progress', overallResult:'pending',
        tracesTo:'DI-001, DI-012, UN-001',
        reportRef:'TR-050 Rev A', executor:'Priya Shah', approvedBy:'', executedDate:''
      },
      'DV-001': {
        id:'DV-001', kind:'validation',
        title:'Simulated-use validation — Clinician workflow',
        method:'Human-factors simulation with 12 clinicians',
        scope:'End-to-end workflow: device setup, patient fitting, data retrieval.',
        acceptance:'Task completion ≥95%; no critical use errors; clinician satisfaction ≥4/5',
        testCases:[
          { id:'TC-V1', criterion:'Successful patient setup', expected:'≥95% completion', result:'pending' },
          { id:'TC-V2', criterion:'Successful data retrieval', expected:'≥95% completion', result:'pending' },
        ],
        executionStatus:'draft', overallResult:'pending',
        tracesTo:'UN-002', reportRef:'', executor:'', approvedBy:'', executedDate:''
      },
    },

    // Step 11 — DMR builder
    qms_dmr: {
      name: 'CardioSync Pro',
      model: 'CSP-100 Rev A',
      version: '1.0',
      udi: '(01)00612345000123(11)250401(21)LOT001',
      effective: '2026-04-01',
      sections: {
        device: [
          { title: 'Device assembly drawing', num: 'DWG-001', rev: 'A', status: 'approved' },
          { title: 'Bill of materials (BOM)', num: 'BOM-001', rev: 'B', status: 'approved' },
          { title: 'Software requirements spec', num: 'SRS-001', rev: 'A', status: 'review' },
          { title: 'Firmware design doc', num: 'SDD-001', rev: 'A', status: 'review' },
        ],
        production: [
          { title: 'Manufacturing process flow', num: 'MPF-001', rev: 'A', status: 'approved' },
          { title: 'PCBA assembly work instruction', num: 'WI-101', rev: 'B', status: 'approved' },
          { title: 'Final assembly work instruction', num: 'WI-120', rev: 'A', status: 'review' },
        ],
        qa: [
          { title: 'Incoming inspection procedure', num: 'QA-IN-001', rev: 'A', status: 'approved' },
          { title: 'In-process inspection plan', num: 'QA-IP-001', rev: 'A', status: 'approved' },
          { title: 'Finished device release criteria', num: 'QA-FR-001', rev: 'A', status: 'approved' },
        ],
        packaging: [
          { title: 'Primary label artwork', num: 'LBL-001', rev: 'A', status: 'approved' },
          { title: 'IFU / user manual', num: 'IFU-001', rev: 'A', status: 'review' },
          { title: 'Packaging specification', num: 'PKG-001', rev: 'A', status: 'approved' },
        ],
        servicing: [
          { title: 'Installation guide', num: 'INS-001', rev: 'A', status: 'draft' },
          { title: 'Service manual', num: 'SVC-001', rev: 'A', status: 'draft' },
        ],
      },
    },

    // Step 12 — Change control (schema matches change-control.html)
    qms_change_requests: {
      'CR-001': {
        id: 'CR-001',
        targetType: 'di', targetId: 'DI-002', targetVersion: 1,
        targetStatement: 'The device shall operate continuously for a minimum of 3 years on a single implanted power source without replacement.',
        changeDescription: 'Increase minimum battery runtime from 3.0 years to 3.5 years based on pilot-study feedback. Swap to higher-capacity cell from Meridian Battery Corp.',
        changeReason: 'Customer feedback from pilot study indicates average patient replacement interval would benefit from longer runtime. Risk/benefit favors the change.',
        urgency: 'routine',
        status: 'approved',
        createdBy: 'Jordan Kim · R&D Lead',
        createdAt: '2026-02-10T09:30:00Z',
        proposedFields: {
          statement: 'The device shall operate continuously for a minimum of 3.5 years on a single implanted power source without replacement.'
        },
        impactDesignInputs: 'DI-002 (battery runtime) — revised threshold.',
        impactDesignOutputs: 'DO-005 (battery cell spec) — new part number.',
        impactRisks: 'RISK-004 (battery failure) — residual risk unchanged; controls verified.',
        impactVV: 'TR-070 (battery life testing) — re-run required with new cell.',
        approvers: ['Mira Chen (RA)', 'Alex Reyes (QA)', 'Jordan Kim (R&D)'],
        closureDate: '2026-02-17',
      },
    },

    // Step 13 — Team & training
    qms_team_people: {
      'P-001': { id:'P-001', name:'Sam Patel',  role:'Product / PM',         started:'2024-03-04', empId:'E001', quals:'BS Biomedical Engineering (MIT 2018); 6 yrs medtech product management at Medtronic and one prior startup; PMP.' },
      'P-002': { id:'P-002', name:'Jordan Kim', role:'R&D Lead',             started:'2024-04-15', empId:'E002', quals:'MS Electrical Engineering (Stanford); 9 yrs cardiac implantable device firmware; prior Abbott.' },
      'P-003': { id:'P-003', name:'Alex Reyes', role:'QA Manager',           started:'2024-05-02', empId:'E003', quals:'CQA (ASQ); 12 yrs FDA-regulated manufacturing quality; ISO 13485 lead auditor.' },
      'P-004': { id:'P-004', name:'Mira Chen',  role:'RA Lead',              started:'2024-05-20', empId:'E004', quals:'JD + MS Regulatory Affairs; 8 yrs 510(k) and CE-mark submissions across cardiac and neuro devices.' },
      'P-005': { id:'P-005', name:'Priya Shah', role:'V&V Lead',             started:'2024-07-10', empId:'E005', quals:'MS Software Engineering; 5 yrs medical device SW verification; IEC 62304 expert.' },
    },

    qms_team_courses: {
      'T-001': { id:'T-001', name:'QMS overview + ISO 13485 basics', sopRef:'QMS-SOP-001', roles:['*'], refreshMonths: 24 },
      'T-002': { id:'T-002', name:'Design Control procedure', sopRef:'DC-SOP-001', roles:['R&D','QA','RA','PM','V&V'], refreshMonths: 24 },
      'T-003': { id:'T-003', name:'Risk Management per ISO 14971', sopRef:'RM-SOP-001', roles:['R&D','QA','RA'], refreshMonths: 24 },
      'T-004': { id:'T-004', name:'CAPA procedure', sopRef:'CAPA-SOP-001', roles:['QA','Ops'], refreshMonths: 36 },
      'T-005': { id:'T-005', name:'Complaint handling & MDR reporting', sopRef:'PMS-SOP-002', roles:['QA'], refreshMonths: 12 },
      'T-006': { id:'T-006', name:'Software lifecycle per IEC 62304', sopRef:'SW-SOP-001', roles:['R&D','V&V'], refreshMonths: 24 },
    },

    qms_training_records: {
      'P-001-T-001': { completed: '2024-03-10', expires: '2026-03-10' },
      'P-001-T-002': { completed: '2024-03-12', expires: '2026-03-12' },
      'P-002-T-001': { completed: '2024-04-20', expires: '2026-04-20' },
      'P-002-T-002': { completed: '2024-04-25', expires: '2026-04-25' },
      'P-002-T-003': { completed: '2024-05-02', expires: '2026-05-02' },
      'P-002-T-006': { completed: '2024-05-10', expires: '2026-05-10' },
      'P-003-T-001': { completed: '2024-05-08', expires: '2026-05-08' },
      'P-003-T-004': { completed: '2024-05-15', expires: '2027-05-15' },
      'P-003-T-005': { completed: '2024-05-20', expires: '2025-05-20' },  // expired → visible alert
      'P-004-T-001': { completed: '2024-05-25', expires: '2026-05-25' },
      'P-004-T-002': { completed: '2024-05-26', expires: '2026-05-26' },
      'P-004-T-003': { completed: '2024-06-02', expires: '2026-06-02' },
      'P-005-T-001': { completed: '2024-07-15', expires: '2026-07-15' },
      'P-005-T-006': { completed: '2024-07-20', expires: '2026-07-20' },
    },

    // Step 14 — Audit center
    qms_internal_audits: {
      'IA-001': {
        id: 'IA-001', title: 'Design Controls internal audit',
        scope: 'Design input/output/trace/verification per 820.30 + §7.3',
        standards: 'FDA 21 CFR 820.30; ISO 13485 §7.3',
        auditor: 'Alex Reyes (QA Manager — independent of design team)',
        date: '2026-03-10', status: 'complete',
        summary: 'Design control records sampled. Traceability matrix intact. Minor observations on version naming conventions.',
        findings: [
          { id: 'F-01', desc: 'Some design inputs lack objective acceptance criteria — traceable but unverifiable.', grade: 'minor', status: 'action-planned', due: '2026-04-15' },
          { id: 'F-02', desc: 'Document version on DWG-015 inconsistent with DMR index.', grade: 'observation', status: 'closed', due: '' },
        ],
      },
    },

    // Step 15 — Post-market
    qms_post_market: {
      scope: 'CardioSync Pro, all variants, all markets (US + EU + Canada). Covers commercial release onward.',
      sources: 'Complaints, device returns, service records, published literature, professional registry (CardioMon Registry), social media monitoring.',
      trending: 'Monthly complaint rate calculation. Signal if complaint rate exceeds 2/1000 devices/month. Any serious incident triggers within-48-hour review.',
      resp: 'PMS owner: Mira Chen (RA Lead). Monthly review with QA. Quarterly report to Management Review.',
      pmcfRequired: 'yes',
      pmcfMethods: 'Prospective CardioMon Registry study (n≥500) + targeted clinician survey every 12 months + literature review cycle.',
      pmcfObjectives: 'Confirm real-world sensitivity ≥97% and confirm no new hazards emerge beyond 12 months of use.',
      metrics: [
        { name: 'Complaint rate (per 1000 devices / month)', current: 0.4, threshold: 2 },
        { name: 'Device failure rate (%)', current: 0.1, threshold: 1 },
        { name: 'Serious incidents (YTD)', current: 0, threshold: 1 },
      ],
      reports: [
        { type: 'PSUR (Class IIa–III)', period: '2026 H1', due: '2026-08-15', owner: 'Mira Chen', status: 'planned' },
      ],
      fscas: [],
    },

    // Advanced — CAPA
    qms_capas: {
      'CAPA-001': {
        id: 'CAPA-001', title: 'Repeated label artwork revision cycle',
        type: 'corrective', source: 'internal-audit', sourceRef: 'IA-001',
        opened: '2026-03-15', owner: 'Alex Reyes',
        severity: 'medium',
        problemStatement: 'Label artwork (LBL-001) has gone through 4 unplanned revisions in 6 weeks due to reviewer disagreements over IFU mapping.',
        immediateContainment: 'Freeze artwork until review path defined. Issue interim label LBL-001 Rev C.2 for current production.',
        stage: 'effectiveness',
        rootCause: 'No single artwork approver defined. Parallel review caused rework.',
        fiveWhys: [
          'Why did artwork go through 4 revisions? Each review round found new issues.',
          'Why did each round find new issues? Multiple reviewers with overlapping scope.',
          'Why multiple reviewers with overlapping scope? Approval authority was ambiguous.',
          'Why ambiguous authority? Artwork approval not explicitly defined in SOP-003.',
          'Why not defined? SOP-003 was written before we added the HF reviewer role — not updated.',
        ],
        actions: [
          { desc: 'Update SOP-003 to explicitly define artwork approval authority (RA single approver)', owner: 'Mira Chen', due: '2026-03-25', status: 'done' },
          { desc: 'Train all artwork reviewers on new approval path', owner: 'Alex Reyes', due: '2026-04-01', status: 'done' },
          { desc: 'Revision count dashboard to detect similar issues early', owner: 'Alex Reyes', due: '2026-05-01', status: 'in-progress' },
        ],
        verification: 'SOP-003 Rev C released 2026-03-24 and training completed by all artwork reviewers (5/5).',
        verificationEvidence: 'SOP-003 Rev C; Training records T-ART-001.',
        effectiveness: 'Tracking revision count per label over 6 months post-implementation. Target: ≤2 revisions per label.',
        effectivenessDate: '2026-09-25',
        effectivenessMetric: 'Revisions per approved label',
        closureSignature: null, closureDate: '',
      },
    },

    // Advanced — Nonconformances
    qms_nonconformances: {
      'NC-001': {
        id:'NC-001', title:'PCBA lot 2026-02-18 fails incoming inspection at 4%',
        foundDate:'2026-02-20', foundBy:'Receiving QC · A. Park',
        stage:'incoming', productRef:'PCBA-CSP-001', lot:'PCB-20260218', quantity:480,
        description:'Random sampling (n=50) found 2/50 boards with visible solder-bridge defects on connector J4. Full lot placed on hold. Contract mfr notified.',
        segregationRef:'HOLD-2026-012 · shelf H4',
        disposition:'rts',
        dispositionJustification:'Return to supplier for 100% rework under their process. Our inspection will re-sample received rework at n=80 to 2% AQL.',
        approver:'Alex Reyes · QA Manager',
        closureDate:'2026-02-25', status:'closed',
        capaLink:''
      },
    },

    // Advanced — Complaints (none open — demonstrates the "no incidents yet" baseline)
    qms_complaints: {
      'COMP-001': {
        id:'COMP-001',
        title:'Device lost BLE pairing during patient walk',
        dateReceived:'2026-03-02', receivedBy:'Clinical ops inbox',
        complainantName:'Dr. L. Torres (pilot site #1)',
        complainantType:'clinician', channel:'email',
        contactInfo:'l.torres@example.com',
        deviceRef:'CSP-100', lot:'LOT-20260115', serial:'SN-00048', eventDate:'2026-02-28',
        description:'Patient reports paired smartphone disconnected from the device twice during a 20-minute walk. Data buffered and uploaded on reconnect. No data loss but patient noticed alerts.',
        isComplaint:'yes', involvedDeath:'no', involvedSerious:'no', malfunctionCouldCause:'no',
        reportable:'no',
        reportableRationale:'No death, injury, or likelihood of serious harm. Event is a UX disruption, not a safety issue. Documented for trending.',
        jurisdictions:[],
        investigation:'Log analysis shows BLE link budget was marginal in open-air environment. Firmware improvement queued (CR-002). Data integrity verified.',
        response:'Thank you for the report — the intermittent BLE disconnect is logged as an enhancement (not a safety issue). Expected fix in firmware v0.5.0.',
        responseSent:'2026-03-05',
        status:'closed', closureDate:'2026-03-06',
        linkedNC:'', linkedCAPA:'', linkedFSCA:'',
      },
    },

    // Advanced — Suppliers
    qms_suppliers: {
      'SUP-001': {
        id:'SUP-001', name:'NovaElectronics Contract Mfg', contact:'j.nakamura@novaelec.example · +1-510-555-0142', website:'https://novaelec.example',
        criticality:'critical', categories:'PCBA assembly, final device assembly, test',
        status:'approved', qualifiedOn:'2024-08-15', nextRequalification:'2026-08-15',
        certifications:[], agreements:{qualityAgreement:true, confidentiality:true, gmpAgreement:true},
        qualEvidence:[
          { type:'audit', ref:'Site audit 2024-07-25', date:'2024-07-25', outcome:'pass' },
          { type:'certificate', ref:'ISO 13485:2016 cert', date:'2024-08-01', outcome:'pass' },
        ],
        metrics:{ otd:97, dpm:420, returns:1 }, notes:'Primary contract manufacturer. Monthly KPI review.'
      },
      'SUP-002': {
        id:'SUP-002', name:'Meridian Battery Corp', contact:'k.almansoori@meridianbat.example', website:'',
        criticality:'critical', categories:'Lithium-polymer battery cells',
        status:'approved', qualifiedOn:'2024-09-10', nextRequalification:'2026-09-10',
        certifications:[], agreements:{qualityAgreement:true, confidentiality:true, gmpAgreement:true},
        qualEvidence:[
          { type:'certificate', ref:'IEC 62133 certification', date:'2024-09-05', outcome:'pass' },
          { type:'audit', ref:'Virtual audit 2024-09-08', date:'2024-09-08', outcome:'pass' },
        ],
        metrics:{ otd:94, dpm:180, returns:0 }, notes:''
      },
      'SUP-003': {
        id:'SUP-003', name:'Precision Sterilization Services', contact:'c.rivera@precisionsterile.example', website:'',
        criticality:'significant', categories:'EtO sterilization (accessories only)',
        status:'qualified', qualifiedOn:'2024-10-12', nextRequalification:'2025-10-12',
        certifications:[], agreements:{qualityAgreement:true, confidentiality:false, gmpAgreement:false},
        qualEvidence:[
          { type:'questionnaire', ref:'Supplier QSA 2024-Q4', date:'2024-10-01', outcome:'pass' },
        ],
        metrics:{ otd:99, dpm:0, returns:0 }, notes:'Limited scope: secondary accessory sterilization only.'
      },
    },

    // Advanced — Equipment & calibration
    qms_equipment: {
      'EQ-001': { id:'EQ-001', asset:'Tektronix DPO3054 Oscilloscope', type:'Test', location:'Test Bench A', mfr:'Tektronix', model:'DPO3054', serial:'TK-2024-015',
        intervalMonths:12, lastCalibration:'2025-10-05', nextCalibration:'2026-10-05',
        lastCalibratedBy:'Metrotech Labs (ISO 17025)', status:'current', traceability:'NIST',
        acceptanceCriteria:'±1.5% full scale', log:[{date:'2025-10-05', by:'Metrotech Labs', result:'pass', certRef:'CERT-2025-1010', asFound:'pass'}], notes:'' },
      'EQ-002': { id:'EQ-002', asset:'Mettler Toledo XS204 Analytical Balance', type:'Measuring', location:'QC Lab', mfr:'Mettler Toledo', model:'XS204', serial:'MT-XS-2021-0034',
        intervalMonths:6, lastCalibration:'2026-01-12', nextCalibration:'2026-07-12',
        lastCalibratedBy:'Metrotech Labs', status:'current', traceability:'NIST',
        acceptanceCriteria:'±0.2mg across 10–200g', log:[{date:'2026-01-12', by:'Metrotech Labs', result:'pass', certRef:'CERT-2026-0115', asFound:'pass'}], notes:'' },
      'EQ-003': { id:'EQ-003', asset:'ESPEC LHL-114 Environmental Chamber', type:'Production', location:'V&V Room', mfr:'ESPEC', model:'LHL-114', serial:'ES-2022-007',
        intervalMonths:12, lastCalibration:'2025-04-20', nextCalibration:'2026-04-20',
        lastCalibratedBy:'ESPEC Service', status:'upcoming', traceability:'NIST',
        acceptanceCriteria:'Temp ±1°C, Humidity ±3% RH', log:[{date:'2025-04-20', by:'ESPEC Service', result:'pass', certRef:'ESPEC-CAL-2025-042', asFound:'pass'}], notes:'Recal due — scheduled.' },
    },

    // Advanced — Management review
    qms_management_reviews: {
      'MR-001': {
        id:'MR-001', title:'Management Review — 2026 Q1', date:'2026-03-28', status:'complete',
        attendees: ['Sam Patel (CEO)', 'Jordan Kim (R&D Lead)', 'Alex Reyes (QA Manager)', 'Mira Chen (RA Lead)'],
        agenda: 'Audit results · Complaints · CAPA status · PMS · Supplier performance · Resource needs',
        inputNotes: {
          audits: '1 internal audit completed (IA-001, Design Controls). 2 findings open — actions in progress.',
          complaints: '1 complaint received (BLE disconnect UX issue). Not reportable. Firmware fix in pipeline.',
          processes: 'NC rate well below threshold. No repeat findings.',
          capa: '1 CAPA in effectiveness monitoring (CAPA-001, artwork revisions). 0 overdue.',
          followup: 'Prior review actions all closed.',
          changes: '1 approved design change (CR-001, battery runtime). No unplanned changes.',
          improvements: 'Consider adding revision-count dashboard across all controlled docs.',
          regulatory: 'Tracking FDA AI/ML guidance updates for future algorithm changes.',
          pms: 'PMS plan in place and monitoring. PSUR due 2026-08-15.',
          supplier: 'All 3 suppliers qualified. SUP-003 re-qual due 2025-10-12.',
        },
        decisions: 'QMS operating effectively. Resource gap: need to hire 1 V&V engineer before verification phase (target Q2 start).',
        resourceDecisions: 'Approve headcount for additional V&V engineer. Approve $15k for revision-dashboard development.',
        actions: [
          { desc: 'Post V&V engineer requisition', owner: 'Sam Patel', due: '2026-04-05', status: 'done' },
          { desc: 'Close IA-001 findings', owner: 'Alex Reyes', due: '2026-04-15', status: 'in-progress' },
          { desc: 'Start SUP-003 re-qualification', owner: 'Mira Chen', due: '2025-09-01', status: 'open' },
        ],
      },
    },

    // Advanced — process validation
    qms_validations: {
      'VAL-001': {
        id:'VAL-001', name:'Final device assembly process', scope:'Full assembly + functional test at NovaElectronics CM.',
        type:'Manufacturing',
        iq:{ status:'complete', protocol:'IQ-001', report:'IQ-001 Rev A', executed:'2026-02-10', notes:'' },
        oq:{ status:'in-progress', protocol:'OQ-001', report:'', executed:'', notes:'Worst-case scenarios running this quarter.' },
        pq:{ status:'planned', protocol:'PQ-001', report:'', executed:'', notes:'3 production runs planned Q2.' },
        lastValidated:'', nextRevalidation:'',
        rationale:'Manual assembly steps cannot be fully verified by final inspection — validation per 820.75 required.'
      },
    },
  };

  // ── SEED API ────────────────────────────────────────────────────────
  function isSeeded() { return localStorage.getItem(FLAG) === '1'; }

  function seed() {
    Object.keys(SEEDS).forEach(function (key) {
      let existing = null;
      try { existing = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
      const seedVal = SEEDS[key];
      if (existing === null) {
        // Key doesn't exist yet — write the seed
        try { localStorage.setItem(key, JSON.stringify(seedVal)); } catch (e) {}
        return;
      }
      // For plain objects (not arrays), merge: add any new seed fields that
      // don't already exist, but preserve existing values (user edits).
      if (existing && typeof existing === 'object' && !Array.isArray(existing) &&
          seedVal && typeof seedVal === 'object' && !Array.isArray(seedVal)) {
        let changed = false;
        Object.keys(seedVal).forEach(function (k) {
          if (!(k in existing)) { existing[k] = seedVal[k]; changed = true; }
        });
        if (changed) {
          try { localStorage.setItem(key, JSON.stringify(existing)); } catch (e) {}
        }
      }
      // Arrays + primitives: leave existing alone (respects user work)
    });
    localStorage.setItem(FLAG, '1');
  }

  function seedForce() {
    Object.keys(SEEDS).forEach(function (key) {
      try { localStorage.setItem(key, JSON.stringify(SEEDS[key])); } catch (e) {}
    });
    localStorage.setItem(FLAG, '1');
  }

  // Auto-seed on script load if demo was previously enabled. This must run
  // synchronously (before page's own init reads localStorage) so pages like
  // user-needs, design-inputs, design-outputs pick up the pre-fill.
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(FLAG) === '1') {
      seed();
    }
  } catch (e) {}

  return { seed: seed, seedForce: seedForce, isSeeded: isSeeded, _SEEDS: SEEDS };
})();
