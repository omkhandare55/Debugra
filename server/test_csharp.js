const axios = require('axios');
axios.post('https://wandbox.org/api/compile.json', {
  code: 'using System;\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello World");\n  }\n}',
  compiler: 'dotnetcore-8.0.402'
}).then(r => console.log(r.data)).catch(e => console.error(e.response ? e.response.data : e.message));
