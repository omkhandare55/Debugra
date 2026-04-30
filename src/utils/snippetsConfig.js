export const registerSnippets = (monaco) => {
  // Helper to get range for replacing the typed snippet keyword
  const getRange = (model, position) => {
    const word = model.getWordUntilPosition(position);
    return {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };
  };

  // Monaco Enums: InsertAsSnippet = 4, Snippet kind = 27
  const insertSnippet = 4;
  const snippetKind = 27;

  // --- JAVA ---
  monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'sysout', kind: snippetKind, insertText: 'System.out.println($1);', insertTextRules: insertSnippet, documentation: 'Print to standard output', range: getRange(model, position) },
        { label: 'syserr', kind: snippetKind, insertText: 'System.err.println($1);', insertTextRules: insertSnippet, documentation: 'Print to standard error', range: getRange(model, position) },
        { label: 'printf', kind: snippetKind, insertText: 'System.out.printf("$1\\n", $2);', insertTextRules: insertSnippet, documentation: 'Print formatted string', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'public static void main(String[] args) {\n\t$1\n}', insertTextRules: insertSnippet, documentation: 'Main method', range: getRange(model, position) },
        { label: 'fori', kind: snippetKind, insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}', insertTextRules: insertSnippet, documentation: 'For loop', range: getRange(model, position) },
      ]
    })
  });

  // --- C++ ---
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'cout', kind: snippetKind, insertText: 'cout << $1 << endl;', insertTextRules: insertSnippet, documentation: 'Print to console', range: getRange(model, position) },
        { label: 'cin', kind: snippetKind, insertText: 'cin >> $1;', insertTextRules: insertSnippet, documentation: 'Read from console', range: getRange(model, position) },
        { label: 'fori', kind: snippetKind, insertText: 'for (int i = 0; i < $1; i++) {\n\t$2\n}', insertTextRules: insertSnippet, documentation: 'For loop', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'int main() {\n\t$1\n\treturn 0;\n}', insertTextRules: insertSnippet, documentation: 'Main function', range: getRange(model, position) },
      ]
    })
  });

  // --- C ---
  monaco.languages.registerCompletionItemProvider('c', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'printf', kind: snippetKind, insertText: 'printf("$1\\n", $2);', insertTextRules: insertSnippet, documentation: 'Print to console', range: getRange(model, position) },
        { label: 'scanf', kind: snippetKind, insertText: 'scanf("%d", &$1);', insertTextRules: insertSnippet, documentation: 'Read from console', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'int main() {\n\t$1\n\treturn 0;\n}', insertTextRules: insertSnippet, documentation: 'Main function', range: getRange(model, position) },
      ]
    })
  });

  // --- JAVASCRIPT & TYPESCRIPT ---
  const jsSnippets = {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'clg', kind: snippetKind, insertText: 'console.log($1);', insertTextRules: insertSnippet, documentation: 'console.log', range: getRange(model, position) },
        { label: 'cerr', kind: snippetKind, insertText: 'console.error($1);', insertTextRules: insertSnippet, documentation: 'console.error', range: getRange(model, position) },
        { label: 'fn', kind: snippetKind, insertText: 'function $1($2) {\n\t$3\n}', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
        { label: 'afn', kind: snippetKind, insertText: 'const $1 = ($2) => {\n\t$3\n};', insertTextRules: insertSnippet, documentation: 'Arrow Function', range: getRange(model, position) },
        { label: 'fori', kind: snippetKind, insertText: 'for (let i = 0; i < $1; i++) {\n\t$2\n}', insertTextRules: insertSnippet, documentation: 'For loop', range: getRange(model, position) },
      ]
    })
  };
  monaco.languages.registerCompletionItemProvider('javascript', jsSnippets);
  monaco.languages.registerCompletionItemProvider('typescript', jsSnippets);

  // --- PYTHON ---
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'pr', kind: snippetKind, insertText: 'print($1)', insertTextRules: insertSnippet, documentation: 'Print', range: getRange(model, position) },
        { label: 'def', kind: snippetKind, insertText: 'def $1($2):\n\t$3', insertTextRules: insertSnippet, documentation: 'Function definition', range: getRange(model, position) },
        { label: 'fori', kind: snippetKind, insertText: 'for i in range($1):\n\t$2', insertTextRules: insertSnippet, documentation: 'For loop', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'if __name__ == "__main__":\n\t$1', insertTextRules: insertSnippet, documentation: 'Main block', range: getRange(model, position) },
      ]
    })
  });

  // --- C# ---
  monaco.languages.registerCompletionItemProvider('csharp', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'cw', kind: snippetKind, insertText: 'Console.WriteLine($1);', insertTextRules: insertSnippet, documentation: 'Console.WriteLine', range: getRange(model, position) },
        { label: 'cr', kind: snippetKind, insertText: 'Console.ReadLine();', insertTextRules: insertSnippet, documentation: 'Console.ReadLine', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'static void Main() {\n\t$1\n}', insertTextRules: insertSnippet, documentation: 'Main method', range: getRange(model, position) },
      ]
    })
  });

  // --- GO ---
  monaco.languages.registerCompletionItemProvider('go', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'fp', kind: snippetKind, insertText: 'fmt.Println($1)', insertTextRules: insertSnippet, documentation: 'fmt.Println', range: getRange(model, position) },
        { label: 'ff', kind: snippetKind, insertText: 'fmt.Printf("$1\\n", $2)', insertTextRules: insertSnippet, documentation: 'fmt.Printf', range: getRange(model, position) },
        { label: 'fn', kind: snippetKind, insertText: 'func $1($2) {\n\t$3\n}', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'func main() {\n\t$1\n}', insertTextRules: insertSnippet, documentation: 'Main func', range: getRange(model, position) },
      ]
    })
  });

  // --- RUST ---
  monaco.languages.registerCompletionItemProvider('rust', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'pl', kind: snippetKind, insertText: 'println!("$1");', insertTextRules: insertSnippet, documentation: 'println!', range: getRange(model, position) },
        { label: 'fn', kind: snippetKind, insertText: 'fn $1($2) {\n\t$3\n}', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
        { label: 'main', kind: snippetKind, insertText: 'fn main() {\n\t$1\n}', insertTextRules: insertSnippet, documentation: 'Main function', range: getRange(model, position) },
      ]
    })
  });

  // --- PHP ---
  monaco.languages.registerCompletionItemProvider('php', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'ec', kind: snippetKind, insertText: 'echo $1;', insertTextRules: insertSnippet, documentation: 'echo', range: getRange(model, position) },
        { label: 'pr', kind: snippetKind, insertText: 'print_r($1);', insertTextRules: insertSnippet, documentation: 'print_r', range: getRange(model, position) },
        { label: 'fn', kind: snippetKind, insertText: 'function $1($2) {\n\t$3\n}', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
      ]
    })
  });

  // --- RUBY ---
  monaco.languages.registerCompletionItemProvider('ruby', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'pu', kind: snippetKind, insertText: 'puts $1', insertTextRules: insertSnippet, documentation: 'puts', range: getRange(model, position) },
        { label: 'def', kind: snippetKind, insertText: 'def $1\n\t$2\nend', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
      ]
    })
  });

  // --- SWIFT ---
  monaco.languages.registerCompletionItemProvider('swift', {
    provideCompletionItems: (model, position) => ({
      suggestions: [
        { label: 'pr', kind: snippetKind, insertText: 'print($1)', insertTextRules: insertSnippet, documentation: 'print', range: getRange(model, position) },
        { label: 'fn', kind: snippetKind, insertText: 'func $1($2) {\n\t$3\n}', insertTextRules: insertSnippet, documentation: 'Function', range: getRange(model, position) },
      ]
    })
  });
};
