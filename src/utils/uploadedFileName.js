function normalizeUploadedFileName(fileName) {
  if (typeof fileName !== "string" || fileName.length === 0) {
    return "file";
  }

  if (!/[^\u0000-\u007f]/.test(fileName)) {
    return fileName;
  }

  const hasOnlyLatin1Chars = [...fileName].every(
    (character) => character.codePointAt(0) <= 0xff
  );

  if (!hasOnlyLatin1Chars) {
    return fileName;
  }

  const decodedFileName = Buffer.from(fileName, "latin1").toString("utf8");

  if (decodedFileName.includes("\uFFFD")) {
    return fileName;
  }

  const hasWideUnicodeChars = [...decodedFileName].some(
    (character) => character.codePointAt(0) > 0xff
  );

  return hasWideUnicodeChars ? decodedFileName : fileName;
}

module.exports = {
  normalizeUploadedFileName,
};
