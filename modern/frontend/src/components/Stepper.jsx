import { CheckIcon } from './icons';

const STEPS = ['Cart', 'Checkout', 'Confirmed'];

// step = 1..3: earlier steps are done, this one is current
export default function Stepper({ step }) {
  return (
    <ol className="m-0 flex list-none items-center gap-[14px] p-0 font-black text-muted">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`flex items-center gap-[10px] before:h-px before:w-16 before:bg-line max-mobile:before:w-[18px] first:before:hidden ${state === 'current' ? 'text-ink' : ''}`}
          >
            <span className={`grid size-[34px] place-items-center rounded-full border text-sm [&>svg]:size-4 ${
              state === 'current' ? 'border-brand bg-brand text-white' : state === 'done' ? 'border-night bg-night text-white' : 'border-line'
            }`}>{n < step ? <CheckIcon /> : n}</span>{label}
          </li>
        );
      })}
    </ol>
  );
}
