export const LANGUAGES = {
  python: {
    id: 71, name: 'Python 3', monacoLang: 'python', icon: '',
    template: `# Python 3\nprint("Hello, World!")\n\nfor i in range(1, 6):\n    print(f"Count: {i}")\n`,
  },
  javascript: {
    id: 63, name: 'JavaScript', monacoLang: 'javascript', icon: '',
    template: `// JavaScript (Node.js)\nconsole.log("Hello, World!");\n\nfor (let i = 1; i <= 5; i++) {\n  console.log(\`Count: \${i}\`);\n}\n`,
  },
  typescript: {
    id: 80, name: 'TypeScript', monacoLang: 'typescript', icon: '',
    template: `// TypeScript\nconst message: string = "Hello, World!";\nconsole.log(message);\n\nconst nums: number[] = [1, 2, 3, 4, 5];\nnums.forEach(n => console.log(\`Count: \${n}\`));\n`,
  },
  java: {
    id: 62, name: 'Java', monacoLang: 'java', icon: '',
    template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n\n        for (int i = 1; i <= 5; i++) {\n            System.out.println("Count: " + i);\n        }\n    }\n}\n`,
  },
  cpp: {
    id: 54, name: 'C++', monacoLang: 'cpp', icon: '',
    template: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n\n    for (int i = 1; i <= 5; i++) {\n        cout << "Count: " << i << endl;\n    }\n    return 0;\n}\n`,
  },
  c: {
    id: 55, name: 'C', monacoLang: 'c', icon: '',
    template: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n\n    for (int i = 1; i <= 5; i++) {\n        printf("Count: %d\\n", i);\n    }\n    return 0;\n}\n`,
  },
  csharp: {
    id: 56, name: 'C#', monacoLang: 'csharp', icon: '',
    template: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n\n        for (int i = 1; i <= 5; i++) {\n            Console.WriteLine($"Count: {i}");\n        }\n    }\n}\n`,
  },
  go: {
    id: 60, name: 'Go', monacoLang: 'go', icon: '',
    template: `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n\n\tfor i := 1; i <= 5; i++ {\n\t\tfmt.Printf("Count: %d\\n", i)\n\t}\n}\n`,
  },
  rust: {
    id: 73, name: 'Rust', monacoLang: 'rust', icon: '',
    template: `fn main() {\n    println!("Hello, World!");\n\n    for i in 1..=5 {\n        println!("Count: {}", i);\n    }\n}\n`,
  },
  ruby: {
    id: 72, name: 'Ruby', monacoLang: 'ruby', icon: '',
    template: `# Ruby\nputs "Hello, World!"\n\n(1..5).each { |i| puts "Count: #{i}" }\n`,
  },
  php: {
    id: 68, name: 'PHP', monacoLang: 'php', icon: '',
    template: `<?php\necho "Hello, World!\\n";\n\nfor ($i = 1; $i <= 5; $i++) {\n    echo "Count: $i\\n";\n}\n?>\n`,
  },
  swift: {
    id: 83, name: 'Swift', monacoLang: 'swift', icon: '',
    template: `// Swift\nprint("Hello, World!")\n\nfor i in 1...5 {\n    print("Count: \\(i)")\n}\n`,
  },
  perl: {
    id: 85, name: 'Perl', monacoLang: 'perl', icon: '',
    template: `#!/usr/bin/perl\nuse strict;\nuse warnings;\n\nprint "Hello, World!\\n";\n\nfor my $i (1..5) {\n    print "Count: $i\\n";\n}\n`,
  },
  lua: {
    id: 64, name: 'Lua', monacoLang: 'lua', icon: '',
    template: `-- Lua\nprint("Hello, World!")\n\nfor i = 1, 5 do\n    print("Count: " .. i)\nend\n`,
  },
  scala: {
    id: 81, name: 'Scala', monacoLang: 'scala', icon: '',
    template: `object Main {\n  def main(args: Array[String]): Unit = {\n    println("Hello, World!")\n\n    for (i <- 1 to 5) {\n      println(s"Count: $i")\n    }\n  }\n}\n`,
  },
  haskell: {
    id: 61, name: 'Haskell', monacoLang: 'haskell', icon: '',
    template: `main :: IO ()\nmain = do\n    putStrLn "Hello, World!"\n    mapM_ (\\i -> putStrLn $ "Count: " ++ show i) [1..5]\n`,
  },
  sql: {
    id: 82, name: 'SQL', monacoLang: 'sql', icon: '',
    template: `-- SQLite\nCREATE TABLE demo (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO demo VALUES (1, 'Hello');\nINSERT INTO demo VALUES (2, 'World');\nSELECT * FROM demo;\n`,
  },
  bash: {
    id: 46, name: 'Bash', monacoLang: 'shell', icon: '',
    template: `#!/bin/bash\necho "Hello, World!"\n\nfor i in {1..5}; do\n    echo "Count: $i"\ndone\n`,
  },
};

export const getLanguageById = (langKey) => LANGUAGES[langKey] || LANGUAGES.python;
