'use client';
import { useState, useMemo, useEffect } from 'react';
import type { QuestionnaireData } from '../../types';
import {
  QUESTIONNAIRE_STEPS,
  isStepComplete,
  firstIncompleteStep,
  type QuestionnaireStepId,
} from '../../utils/questionnaireSteps';
import { WizardStepper } from './WizardStepper';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { HistoryStep } from './steps/HistoryStep';
import { HearingStep } from './steps/HearingStep';
import { CosiStep } from './steps/CosiStep';
import { AdvancedSurveySection } from './steps/AdvancedSurveySection';

interface Props {
  initialData: Partial<QuestionnaireData>;
  onSave: (data: Partial<QuestionnaireData>) => void;
  onDataChange?: (data: Partial<QuestionnaireData>) => void;
}

export function QuestionnaireWizard({ initialData, onSave, onDataChange }: Props) {
  const [data, setData] = useState<Partial<QuestionnaireData>>(initialData);
  const [currentId, setCurrentId] = useState<QuestionnaireStepId>('basic');
  // firstIncompleteStep kept imported for future use (resume navigation)
  void firstIncompleteStep;

  useEffect(() => {
    onDataChange?.(data);
  }, [data, onDataChange]);

  const completedIds = useMemo(
    () => QUESTIONNAIRE_STEPS.filter(s => isStepComplete(s.id, data)).map(s => s.id),
    [data]
  );
  const currentIdx = QUESTIONNAIRE_STEPS.findIndex(s => s.id === currentId);
  const isLast = currentIdx === QUESTIONNAIRE_STEPS.length - 1;
  const canAdvance = isStepComplete(currentId, data);

  const handleChange = (patch: Partial<QuestionnaireData>) =>
    setData(prev => ({ ...prev, ...patch }));

  const StepComponent = {
    basic: BasicInfoStep,
    history: HistoryStep,
    hearing: HearingStep,
    cosi: CosiStep,
  }[currentId];

  return (
    <div className="flex flex-col gap-6">
      <WizardStepper
        steps={QUESTIONNAIRE_STEPS}
        currentId={currentId}
        completedIds={completedIds}
        onNavigate={setCurrentId}
      />
      <StepComponent data={data} onChange={handleChange} />
      <div className="flex justify-between">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentId(QUESTIONNAIRE_STEPS[currentIdx - 1].id)}
          className="px-6 py-2 rounded-xl border border-slate-300 disabled:opacity-40"
        >
          이전
        </button>
        {isLast ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => onSave(data)}
            className="px-6 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-40"
          >
            저장
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setCurrentId(QUESTIONNAIRE_STEPS[currentIdx + 1].id)}
            className="px-6 py-2 rounded-xl bg-blue-500 text-white disabled:opacity-40"
          >
            다음
          </button>
        )}
      </div>
      <AdvancedSurveySection data={data} onChange={handleChange} />
    </div>
  );
}
