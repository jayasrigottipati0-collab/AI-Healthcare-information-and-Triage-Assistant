import { analyzeSymptoms } from './agents/symptomAgent.js';
import { evaluateSafety } from './safety/safetyRules.js';
import { determineTriage } from './agents/triageAgent.js';

export async function processTriageRequest(symptoms, history) {
    const trace = [];

    // Step 1: Symptom Agent
    trace.push({ step: 'Symptom Agent', status: 'Processing' });
    const symptomAnalysis = await analyzeSymptoms(symptoms, history);
    trace[trace.length - 1].status = 'Completed';
    trace[trace.length - 1].result = symptomAnalysis;

    // If symptom agent needs more info, return early
    if (symptomAnalysis.needsMoreInfo) {
        return {
            status: 'NEEDS_MORE_INFO',
            message: symptomAnalysis.followUpQuestion,
            trace
        };
    }

    // Step 2: Deterministic Safety Rules
    trace.push({ step: 'Safety Check', status: 'Processing' });
    const safetyResult = evaluateSafety(symptomAnalysis.extractedSymptoms);
    trace[trace.length - 1].status = 'Completed';
    trace[trace.length - 1].result = safetyResult;

    if (safetyResult.isEmergency) {
        trace.push({ step: 'Triage Agent', status: 'Skipped' });
        return {
            status: 'EMERGENCY',
            message: safetyResult.reason,
            trace
        };
    }

    // Step 3: Triage Agent
    trace.push({ step: 'Triage Agent', status: 'Processing' });
    const triageResult = await determineTriage(symptomAnalysis.extractedSymptoms, history);
    trace[trace.length - 1].status = 'Completed';
    trace[trace.length - 1].result = triageResult;

    return {
        status: triageResult.category,
        message: triageResult.explanation,
        medications: triageResult.overTheCounterSuggestions || [],
        medicines: triageResult.medicines || [],
        trace
    };
}
