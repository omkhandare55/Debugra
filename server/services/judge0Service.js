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
  56: 'mono-6.12.0.199',       // C# (Mono instead of dotnetcore to avoid file size limits)
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

let activeRequests = 0;
const MAX_CONCURRENT = 2; // Wandbox rate-limit protection
const requestQueue = [];

async function acquireLock() {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  return new Promise(resolve => requestQueue.push(resolve));
}

function releaseLock() {
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    next();
  } else {
    activeRequests--;
  }
}

async function executeCode(sourceCode, languageId, stdin = '') {
  const compiler = WANDBOX_COMPILERS[languageId];
  if (!compiler) {
    throw new Error(`Unsupported language ID: ${languageId}`);
  }

  // Wandbox defaults Java files to prog.java, which breaks if class is 'public'
  if (languageId === 62 || languageId === '62') {
    sourceCode = sourceCode.replace(/public\s+class\s/g, 'class ');
  }

  await acquireLock();
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
    const hasRuntimeError = exitCode !== 0 && !hasCompileError;

    // If there is stdout, mark it as successful as requested by user
    const finalStatus = (stdout.trim().length > 0) 
      ? { id: 3, description: 'Accepted' }
      : {
          id: hasCompileError ? 6 : hasRuntimeError ? 11 : 3,
          description: hasCompileError ? 'Compilation Error' :
                       hasRuntimeError ? 'Runtime Error' : 'Accepted',
        };

    return {
      stdout: stdout || null,
      stderr: stderr || null,
      compile_output: compileOut || null,
      status: finalStatus,
      time: null,
      memory: null,
    };
  } catch (err) {
    throw new Error(`Execution failed: ${err.message}`);
  } finally {
    releaseLock();
  }
}

module.exports = { executeCode };
