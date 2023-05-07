module.exports = (data) => {
  const delimIndex = data.indexOf('\r\n\r\n');
  const lines = data.slice(0, delimIndex).toString('utf8').split('\r\n');
  const startLine = lines[0];
  const headers = lines.slice(1);
  const body = data.slice(delimIndex + 4);

  const headerObj = {};
  headers.forEach((h) => {
    const parts = h.split(': ');
    headerObj[parts[0].toLowerCase()] = parts[1];
  });

  const reqLineParts = startLine.split(' ');

  return {
    method: reqLineParts[0],
    path: reqLineParts[1],
    headers: headerObj,
    body,
  };
};
