import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WizardStepper } from './WizardStepper';
import { QUESTIONNAIRE_STEPS } from '../../utils/questionnaireSteps';

describe('WizardStepper', () => {
  it('renders all steps with labels', () => {
    render(<WizardStepper steps={QUESTIONNAIRE_STEPS} currentId="history" completedIds={['basic']} onNavigate={() => {}} />);
    expect(screen.getByText('기본 정보')).toBeInTheDocument();
    expect(screen.getByText('병력')).toBeInTheDocument();
    expect(screen.getByText('COSI')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(<WizardStepper steps={QUESTIONNAIRE_STEPS} currentId="history" completedIds={['basic']} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('병력');
  });
});
