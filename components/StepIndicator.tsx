
import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps = [
  { id: Step.VERIFY_OTP, label: 'Xác thực' },
  { id: Step.UPLOAD_PORTRAIT, label: 'Tải ảnh' },
  { id: Step.DESIGN_WORKBENCH, label: 'Thiết kế' },
  { id: Step.PREVIEW_FINAL, label: 'Kết quả' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  // Fix: Removed Step.UPLOAD_CHECKIN as it does not exist in the Step enum.
  // Using Step.UPLOAD_PORTRAIT and Step.REMOVE_BG logic to highlight the correct progress index.
  const currentIndex = steps.findIndex(s => 
    s.id === currentStep || 
    (currentStep === Step.REMOVE_BG && s.id === Step.UPLOAD_PORTRAIT)
  );

  return (
    <div className="flex justify-between items-center w-full max-w-md mx-auto mb-8 px-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              index <= currentIndex ? 'bg-yellow-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {index + 1}
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${
              index <= currentIndex ? 'text-yellow-600' : 'text-slate-400'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-[2px] mx-2 -mt-4 transition-colors ${
              index < currentIndex ? 'bg-yellow-500' : 'bg-slate-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
