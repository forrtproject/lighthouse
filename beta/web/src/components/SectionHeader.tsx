import type { Answer } from '../lib/signals';
import { Verdict } from './Tone';

/** Answer-first section heading: the question, then the answer, then the evidence below. */
export function SectionHeader({ id, question, answer }: { id: string; question: string; answer?: Answer }) {
  return (
    <header className="section-header" id={id}>
      <h2>{question}</h2>
      {answer && (
        <p className="answer">
          <Verdict tone={answer.tone}>{answer.verdict}</Verdict>
          <span>{answer.text}</span>
        </p>
      )}
    </header>
  );
}
