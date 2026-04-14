import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionnaireWizard } from './QuestionnaireWizard';

describe('QuestionnaireWizard', () => {
  it('starts on "basic" step', () => {
    render(<QuestionnaireWizard initialData={{}} onSave={vi.fn()} onDataChange={vi.fn()} />);
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('기본 정보');
  });

  it('blocks "다음" until basic step is complete', () => {
    render(<QuestionnaireWizard initialData={{}} onSave={vi.fn()} onDataChange={vi.fn()} />);
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).toBeDisabled();
  });

  it('enables "다음" once visit_motives has an item', () => {
    render(
      <QuestionnaireWizard
        initialData={{ visit_motives: ['지인 소개'] }}
        onSave={vi.fn()}
        onDataChange={vi.fn()}
      />
    );
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).not.toBeDisabled();
  });
});
