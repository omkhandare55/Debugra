export const PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.',
    ],
    tags: ['Array', 'Hash Table'],
  },
  {
    id: 2,
    title: 'Reverse a String',
    difficulty: 'Easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: 'The string is reversed in-place.',
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: 'The string is reversed in-place.',
      },
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁵',
      's[i] is a printable ASCII character.',
    ],
    tags: ['Two Pointers', 'String'],
  },
  {
    id: 3,
    title: 'FizzBuzz',
    difficulty: 'Easy',
    description: `Given an integer \`n\`, return a string array \`answer\` (1-indexed) where:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i\` (as a string) if none of the above conditions are true.`,
    examples: [
      {
        input: 'n = 3',
        output: '["1","2","Fizz"]',
        explanation: 'Only 3 is divisible by 3.',
      },
      {
        input: 'n = 5',
        output: '["1","2","Fizz","4","Buzz"]',
        explanation: '3 is divisible by 3, 5 is divisible by 5.',
      },
    ],
    constraints: ['1 ≤ n ≤ 10⁴'],
    tags: ['Math', 'String', 'Simulation'],
  },
];
