export const LANGUAGES = {
  python: { id: 71, name: 'Python 3', monacoLang: 'python', icon: '', template: `import sys\nimport math\n\ndef main():\n    # your code goes here\n    pass\n\nif __name__ == '__main__':\n    main()\n` },
  javascript: { id: 63, name: 'JavaScript', monacoLang: 'javascript', icon: '', template: `const fs = require('fs');\n\nfunction main() {\n    // your code goes here\n}\n\nmain();\n` },
  typescript: { id: 80, name: 'TypeScript', monacoLang: 'typescript', icon: '', template: `function main() {\n    // your code goes here\n}\n\nmain();\n` },
  java: { id: 62, name: 'Java', monacoLang: 'java', icon: '', template: `import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n\nclass Main {\n    public static void main(String[] args) throws java.lang.Exception {\n        // your code goes here\n    }\n}\n` },
  cpp: { id: 54, name: 'C++', monacoLang: 'cpp', icon: '', template: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // your code goes here\n    \n    return 0;\n}\n` },
  c: { id: 55, name: 'C', monacoLang: 'c', icon: '', template: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\nint main() {\n    // your code goes here\n    return 0;\n}\n` },
  csharp: { id: 56, name: 'C#', monacoLang: 'csharp', icon: '', template: `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass Program {\n    static void Main(string[] args) {\n        // your code goes here\n    }\n}\n` },
  go: { id: 60, name: 'Go', monacoLang: 'go', icon: '', template: `package main\n\nimport (\n\t"fmt"\n\t"math"\n)\n\nfunc main() {\n\t// your code goes here\n}\n` },
  rust: { id: 73, name: 'Rust', monacoLang: 'rust', icon: '', template: `use std::io;\n\nfn main() {\n    // your code goes here\n}\n` },
  ruby: { id: 72, name: 'Ruby', monacoLang: 'ruby', icon: '', template: `# your code goes here\n` },
  php: { id: 68, name: 'PHP', monacoLang: 'php', icon: '', template: `<?php\n// your code goes here\n?>\n` },
  swift: { id: 83, name: 'Swift', monacoLang: 'swift', icon: '', template: `import Foundation\n\n// your code goes here\n` },
  perl: { id: 85, name: 'Perl', monacoLang: 'perl', icon: '', template: `#!/usr/bin/perl\nuse strict;\nuse warnings;\n\n# your code goes here\n` },
  lua: { id: 64, name: 'Lua', monacoLang: 'lua', icon: '', template: `-- your code goes here\n` },
  scala: { id: 81, name: 'Scala', monacoLang: 'scala', icon: '', template: `import java.util.Scanner\n\nobject Main {\n  def main(args: Array[String]): Unit = {\n    // your code goes here\n  }\n}\n` },
  haskell: { id: 61, name: 'Haskell', monacoLang: 'haskell', icon: '', template: `import Data.List\n\nmain :: IO ()\nmain = do\n    -- your code goes here\n    return ()\n` },
  sql: { id: 82, name: 'SQL', monacoLang: 'sql', icon: '', template: `-- your SQL goes here\n` },
  bash: { id: 46, name: 'Bash', monacoLang: 'shell', icon: '', template: `#!/bin/bash\n\n# your code goes here\n` },
};

export const getLanguageById = (langKey) => LANGUAGES[langKey] || LANGUAGES.python;
