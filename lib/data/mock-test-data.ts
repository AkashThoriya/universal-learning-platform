import { AdaptiveQuestion } from '@/types/adaptive-testing';

export const STATIC_MOCK_TEST_QUESTIONS: AdaptiveQuestion[] = [
  {
    id: 'mock_math_001',
    question: 'Solve for **x** in the logarithmic equation:\n\n`log₂(x) + log₂(x-2) = 3`',
    type: 'multiple_choice',
    options: ['x = 4', 'x = -2', 'x = 4, x = -2', 'x = 2'],
    correctAnswer: 'x = 4',
    explanation: `**Step-by-step Solution:**

1.  **Combine Logarithms**: Use the product rule \`log_b(A) + log_b(C) = log_b(A · C)\`
    \`log₂(x(x-2)) = 3\`

2.  **Exponentiate**: Convert to exponential form \`2³ = 8\`.
    \`x(x-2) = 8\`
    \`x² - 2x - 8 = 0\`

3.  **Factor the Quadratic**:
    \`(x-4)(x+2) = 0\`
    So, \`x = 4\` or \`x = -2\`.

4.  **Check Validity**: Logarithms are undefined for negative numbers and zero.
    *   For \`x = 4\`: \`log₂(4) + log₂(2) = 2 + 1 = 3\`. (Valid)
    *   For \`x = -2\`: \`log₂(-2)\` is undefined. (Invalid)

**Conclusion**: The only valid solution is **x = 4**.`,
    difficulty: 'advanced',
    subject: 'Mathematics',
    topics: ['Algebra', 'Logarithms'],
    discriminationIndex: 1.5,
    bloomsLevel: 'analyze'
  },
  {
    id: 'mock_cs_001',
    question: 'Analyze the time complexity of the following recursive function:',
    codeSnippet: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    type: 'multiple_choice',
    options: ['O(n)', 'O(n log n)', 'O(2^n)', 'O(n^2)'],
    correctAnswer: 'O(2^n)',
    explanation: `**Analysis:**

The provided code is the naive recursive implementation of Fibonacci numbers.

*   Each call to \`fib(n)\` branches into two recursive calls: \`fib(n-1)\` and \`fib(n-2)\`.
*   This creates a binary tree of function calls.
*   The depth of the tree is $n$.
*   The number of nodes in this tree grows exponentially.

Mathematically, the recurrence relation is $T(n) = T(n-1) + T(n-2) + O(1)$, which solves to **O(2^n)** (specifically closer to $O(1.618^n)$).

To optimize this to $O(n)$, one would use **memoization** or an **iterative approach**.`,
    difficulty: 'intermediate',
    subject: 'Computer Science',
    topics: ['Algorithms', 'Complexity Analysis'],
    discriminationIndex: 1.2,
    bloomsLevel: 'evaluate'
  },
  {
    id: 'mock_physics_001',
    question: 'A projectile is launched with an initial velocity `v₀` at an angle `θ` to the horizontal. Assuming no air resistance, which factor determines the **maximum height** reached?',
    type: 'multiple_choice',
    options: [
      'The horizontal component of velocity (v₀ cos θ)',
      'The vertical component of velocity (v₀ sin θ)',
      'The mass of the projectile',
      'The horizontal range'
    ],
    correctAnswer: 'The vertical component of velocity (v₀ sin θ)',
    explanation: `**Physics Principles:**

1.  **Independence of Motion**: Horizontal and vertical motions are independent.
2.  **Vertical Motion**: The maximum height depends *only* on the initial vertical velocity and gravity.
    \`H = (v₀ sin θ)² / 2g\`
3.  **Horizontal Motion**: Determines range, but not height.
4.  **Mass**: In the absence of air resistance, mass does not affect the trajectory (Galileo's principle).

Therefore, the **vertical component (\`v₀ sin θ\`)** is the sole determinant of maximum height.`,
    difficulty: 'intermediate',
    subject: 'Physics',
    topics: ['Kinematics', 'Projectile Motion'],
    discriminationIndex: 1.1,
    bloomsLevel: 'understand'
  },
  {
    id: 'mock_logic_001',
    question: 'Identify the logical fallacy in the following statement:\n\n*"You cannot prove that ghosts do not exist; therefore, they must exist."*',
    type: 'multiple_choice',
    options: [
      'Ad Hominem',
      'Appeal to Ignorance (Argumentum ad Ignorantiam)',
      'Straw Man',
      'False Dichotomy'
    ],
    correctAnswer: 'Appeal to Ignorance (Argumentum ad Ignorantiam)',
    explanation: `**Reasoning:**

The statement argues that a proposition is true simply because it has not been proven false. This is a text-book definition of the **Appeal to Ignorance**.

*   **Absence of evidence is not evidence of absence**, but neither is it evidence of *presence*.
*   The burden of proof lies with the person making the positive claim (that ghosts exist), not on the skeptic to disprove it.`,
    difficulty: 'intermediate',
    subject: 'Logic',
    topics: ['Critical Thinking', 'Fallacies'],
    discriminationIndex: 0.9,
    bloomsLevel: 'analyze'
  },
  {
    id: 'mock_history_001',
    question: 'Which treaty effectively ended the **Thirty Years\' War** in 1648 and established the principle of *cuius regio, eius religio* within the Holy Roman Empire?',
    type: 'multiple_choice',
    options: [
      'Treaty of Versailles',
      'Peace of Westphalia',
      'Treaty of Utrecht',
      'Congress of Vienna'
    ],
    correctAnswer: 'Peace of Westphalia',
    explanation: `**Historical Context:**

The **Peace of Westphalia** (1648) is a series of peace treaties that ended the Thirty Years' War in the Holy Roman Empire and the Eighty Years' War between Spain and the Dutch Republic.

*   **Significance**: It marked the beginning of the modern international system based on the concept of Westphalian sovereignty (state sovereignty).
*   **Religious Outcome**: It extended the Peace of Augsburg's provisions (*cuius regio, eius religio*) to include Calvinism, not just Lutheranism and Catholicism.`,
    difficulty: 'advanced',
    subject: 'History',
    topics: ['European History', '17th Century'],
    discriminationIndex: 1.3,
    bloomsLevel: 'remember'
  }
];
