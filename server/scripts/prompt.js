// Tiny terminal prompter shared by the admin scripts. Answers can be typed hidden (shown as *), so
// passwords and connection strings never appear on screen or in a screenshot.
const readline = require('readline');

// One readline interface that hands out typed lines one at a time (works for typing and for piped input)
const createPrompter = () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  const waiting = [];
  const buffered = [];
  let muted = false;

  // While `muted`, echo a * instead of what is typed
  const writeOut = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (text) => {
    if (muted && !/[\r\n]/.test(text)) rl.output.write('*');
    else writeOut(text);
  };

  rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : buffered.push(line)));

  const ask = (question, { hidden = false } = {}) =>
    new Promise((resolve) => {
      process.stdout.write(question);
      muted = hidden;
      const done = (line) => {
        muted = false;
        resolve(line.trim());
      };
      buffered.length ? done(buffered.shift()) : waiting.push(done);
    });

  return { ask, close: () => rl.close() };
};

module.exports = { createPrompter };
