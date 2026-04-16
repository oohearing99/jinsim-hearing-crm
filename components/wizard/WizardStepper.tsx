'use client';
import { Check } from 'lucide-react';
import type { QuestionnaireStepDef, QuestionnaireStepId } from '../../utils/questionnaireSteps';

interface Props {
  steps: QuestionnaireStepDef[];
  currentId: QuestionnaireStepId;
  completedIds: QuestionnaireStepId[];
  onNavigate: (id: QuestionnaireStepId) => void;
}

export function WizardStepper({ steps, currentId, completedIds, onNavigate }: Props) {
  return (
    <nav aria-label="문진 단계" className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentId;
        const isDone = completedIds.includes(step.id);
        const circle =
          isDone
            ? 'bg-slate-900 text-white'
            : isCurrent
              ? 'bg-blue-500 text-white ring-4 ring-blue-100'
              : 'bg-slate-200 text-slate-500';
        return (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(step.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1"
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${circle}`}>
                {isDone ? <Check size={18} /> : idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-700">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span className={`w-8 h-0.5 ${isDone ? 'bg-slate-900' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
