const _realConsole = window.console;
const consoleOutput = (logAuthor = "[cs]") => {
  const style = {
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
};

export default (author) => {
  const output = consoleOutput(author);

  const console = {
    ..._realConsole,
    log: _realConsole.log.bind(_realConsole, ...output),
    warn: _realConsole.warn.bind(_realConsole, ...output),
    error: _realConsole.error.bind(_realConsole, ...output),
  };

  return console;
};

export {
    _realConsole as console
}