const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'python',
      version: '*',
      files: [{ name: 'main.py', content: 'print("hello")' }]
    });
    console.log(res.data);
  } catch (e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
