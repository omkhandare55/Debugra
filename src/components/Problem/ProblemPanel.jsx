import { BookOpen, Tag } from 'lucide-react';

const PROBLEMS = [
  {
    id: 1, title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'],
    description: `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to 'target'.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', '-10⁹ ≤ target ≤ 10⁹', 'Only one valid answer exists.'],
  },
];

export default function ProblemPanel() {
  const problem = PROBLEMS[0];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Problem</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Title */}
        <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {problem.id}. {problem.title}
        </h2>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className={`problem-tag problem-tag-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          {problem.tags.map((tag) => (
            <span key={tag} className="problem-tag problem-tag-topic">
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          {problem.description}
        </p>

        {/* Examples */}
        {problem.examples.map((ex, i) => (
          <div key={i} className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Example {i + 1}</div>
            <div className="font-mono text-xs space-y-1">
              <div><span style={{ color: '#8b5cf6' }}>Input:</span> <span style={{ color: 'var(--text-secondary)' }}>{ex.input}</span></div>
              <div><span style={{ color: '#10b981' }}>Output:</span> <span style={{ color: 'var(--text-secondary)' }}>{ex.output}</span></div>
            </div>
            {ex.explanation && (
              <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>💡 {ex.explanation}</div>
            )}
          </div>
        ))}

        {/* Constraints */}
        <div className="mt-4">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            ⚠️ Constraints
          </div>
          <ul className="space-y-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="text-xs font-mono pl-3" style={{ color: 'var(--text-muted)' }}>• {c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
