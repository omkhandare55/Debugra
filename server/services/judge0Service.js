const axios = require('axios');

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// All Wandbox compiler mappings — verified against their live API
const WANDBOX_COMPILERS = {
  71: 'cpython-3.12.7',        // Python
  63: 'nodejs-20.17.0',        // JavaScript
  80: 'typescript-5.6.2',      // TypeScript
  62: 'openjdk-jdk-22+36',     // Java
  54: 'gcc-13.2.0',            // C++
  55: 'gcc-13.2.0-c',          // C
  56: 'dotnetcore-8.0.402',    // C#
  60: 'go-1.23.2',             // Go
  73: 'rust-1.82.0',           // Rust
  72: 'ruby-3.4.9',            // Ruby
  68: 'php-8.3.12',            // PHP
  83: 'swift-6.0.1',           // Swift
  85: 'perl-5.42.0',           // Perl
  64: 'lua-5.4.7',             // Lua
  81: 'scala-3.5.1',           // Scala
  61: 'ghc-9.10.1',            // Haskell
  82: 'sqlite-3.46.1',         // SQL
  46: 'bash',                  // Bash
};

async function executeCode(sourceCode, languageId, stdin = '') {
  const compiler = WANDBOX_COMPILERS[languageId];
  if (!compiler) {
    throw new Error(`Unsupported language ID: ${languageId}`);
  }

  try {
    const { data } = await axios.post(WANDBOX_API, {
      code: sourceCode,
      compiler: compiler,
      stdin: stdin || '',
      'compiler-option-raw': '',
      'runtime-option-raw': '',
    }, { timeout: 30000 });

    const stdout = data.program_output || '';
    const stderr = data.compiler_error || data.program_error || '';
    const compileOut = data.compiler_output || '';
    const exitCode = data.status || 0;

    const hasCompileError = data.compiler_error && data.compiler_error.trim().length > 0 && exitCode !== 0;
    const hasRuntimeError = data.program_error && data.program_error.trim().length > 0;

    return {
      stdout: stdout || null,
      stderr: stderr || null,
      compile_output: compileOut || null,
      status: {
        id: hasCompileError ? 6 : (exitCode !== 0 || hasRuntimeError) ? 11 : 3,
        description: hasCompileError ? 'Compilation Error' :
                     (exitCode !== 0 || hasRuntimeError) ? 'Runtime Error' : 'Accepted',
      },
      time: null,
      memory: null,
    };
  } catch (err) {
    throw new Error(`Execution failed: ${err.message}`);
  }
}

module.exports = { executeCode };
