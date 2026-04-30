const axios = require('axios');

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// Mapping frontend IDs to Wandbox compiler names
const WANDBOX_COMPILERS = {
  71: 'cpython-3.13.8',      // Python
  63: 'nodejs-20.17.0',     // JavaScript
  80: 'typescript-5.6.2',   // TypeScript
  62: 'openjdk-jdk-21+35',  // Java
  54: 'gcc-13.2.0',         // C++
  55: 'gcc-13.2.0-c',       // C
  60: 'go-1.23.2',          // Go
  73: 'rust-1.82.0',        // Rust
  56: 'dotnetcore-8.0.402', // C#
  72: 'ruby-3.4.9',         // Ruby
  68: 'php-8.3.12',         // PHP
  64: 'lua-5.4.7',          // Lua
  81: 'scala-3.5.1',        // Scala
  61: 'ghc-9.10.1',         // Haskell
  82: 'sqlite-3.46.1',      // SQLite
  46: 'bash',               // Bash
  83: 'swift-6.0.1',        // Swift
  85: 'perl-5.40.0',        // Perl
};

// Extra compiler flags per language
const COMPILER_OPTIONS = {
  'gcc-13.2.0': '-std=c++17',
  'gcc-13.2.0-c': '-std=c11',
};

async function executeCode(sourceCode, languageId, stdin = '') {
  const compiler = WANDBOX_COMPILERS[languageId];
  if (!compiler) {
    throw new Error(`Language ID ${languageId} is not supported. Try C++, Python, Java, or JavaScript.`);
  }

  try {
    const body = {
      compiler: compiler,
      code: sourceCode,
      stdin: stdin || '',
      save: false,
    };

    if (COMPILER_OPTIONS[compiler]) {
      body.compiler_option_raw = COMPILER_OPTIONS[compiler];
    }

    const { data } = await axios.post(WANDBOX_API, body, { timeout: 30000 });

    const stdout = data.program_output || '';
    const compileError = data.compiler_error || '';
    const runtimeError = data.program_error || '';
    const exitCode = parseInt(data.status ?? '0');

    // Compile error takes priority, then runtime error, then exit code
    const hasCompileError = compileError.trim().length > 0;
    const hasRuntimeError = runtimeError.trim().length > 0;
    const isSuccess = !hasCompileError && exitCode === 0;

    const finalStatus = isSuccess
      ? { id: 3, description: 'Accepted' }
      : {
          id: hasCompileError ? 6 : 11,
          description: hasCompileError ? 'Compilation Error' : 'Runtime Error',
        };

    // Merge compile errors into stderr so the frontend Errors tab shows them
    const stderrOutput = hasCompileError
      ? (compileError + (runtimeError ? '\n' + runtimeError : ''))
      : (runtimeError || null);

    return {
      stdout: stdout || null,
      stderr: stderrOutput || null,
      compile_output: compileError || null,
      status: finalStatus,
      time: null,
      memory: null,
    };
  } catch (err) {
    throw new Error(`Wandbox execution failed: ${err.message}`);
  }
}

module.exports = { executeCode };
