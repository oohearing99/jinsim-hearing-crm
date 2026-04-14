import React from 'react';
import { CompletionStatus } from '../utils/completionUtils';

interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  statuses: Record<string, CompletionStatus>;
  currentStepIndex: number;
  onStepClick: (stepIndex: number) => void;
}

export default function StepIndicator({ steps, statuses, currentStepIndex, onStepClick }: Props) {
  return (
    <div className="bg-white px-6 py-5 border-b border-slate-200">
      <div className="flex items-start relative">
        {/* 연결선 배경 */}
        <div
          className="absolute h-[3px] bg-slate-200 rounded-full"
          style={{ top: '14px', left: '40px', right: '40px' }}
        />
        {/* 연결선 진행 (완료된 구간) */}
        {currentStepIndex > 0 && (
          <div
            className="absolute h-[3px] bg-slate-900 rounded-full transition-all duration-500"
            style={{
              top: '14px',
              left: '40px',
              width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 80px * ${currentStepIndex / (steps.length - 1)})`,
            }}
          />
        )}

        {steps.map((step, i) => {
          const status = statuses[step.id] || 'not_started';
          const isCurrent = i === currentStepIndex;
          const isCompleted = status === 'completed';
          const isPast = i < currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex-1 flex flex-col items-center gap-2 relative z-10 cursor-pointer"
              onClick={() => onStepClick(i)}
            >
              {/* 원형 번호 */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  isCompleted || isPast
                    ? 'bg-slate-900 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white shadow-[0_0_0_4px_#dbeafe]'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isCompleted || isPast ? '✓' : i + 1}
              </div>
              {/* 라벨 */}
              <div className="text-center">
                <div
                  className={`text-[11px] font-bold ${
                    isCompleted || isPast
                      ? 'text-slate-900'
                      : isCurrent
                      ? 'text-blue-600 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
                {isCompleted && (
                  <div className="text-[9px] text-green-600 font-bold mt-0.5">완료</div>
                )}
                {isCurrent && !isCompleted && (
                  <div className="text-[9px] text-blue-500 font-bold mt-0.5">진행중</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
