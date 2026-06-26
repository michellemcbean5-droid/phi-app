const KEY_ROTATION_DAYS = 30;
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index] ?? 0;
    const byte2 = bytes[index + 1] ?? 0;
    const byte3 = bytes[index + 2] ?? 0;
    const combined = (byte1 << 16) | (byte2 << 8) | byte3;

    output += BASE64_ALPHABET[(combined >> 18) & 63];
    output += BASE64_ALPHABET[(combined >> 12) & 63];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(combined >> 6) & 63] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[combined & 63] : '=';
  }

  return output;
};

const decodeBase64 = (encoded: string): string => {
  const cleaned = encoded.replace(/=+$/, '');
  const bytes: number[] = [];

  for (let index = 0; index < cleaned.length; index += 4) {
    const chunk = cleaned.slice(index, index + 4).padEnd(4, 'A');
    const values = chunk.split('').map((character) => BASE64_ALPHABET.indexOf(character));
    const combined = (values[0] << 18) | (values[1] << 12) | ((values[2] & 63) << 6) | (values[3] & 63);

    bytes.push((combined >> 16) & 255);
    if (chunk[2] !== 'A' || cleaned.length % 4 !== 2) {
      bytes.push((combined >> 8) & 255);
    }
    if (chunk[3] !== 'A' || cleaned.length % 4 === 0) {
      bytes.push(combined & 255);
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
};

export const encryptSensitiveData = (data: string): string => {
  if (!data.trim()) {
    throw new Error('Sensitive data is required for encryption.');
  }

  return `aes256-stub:${encodeBase64(data)}`;
};

export const decryptSensitiveData = (encrypted: string): string => {
  if (!encrypted.startsWith('aes256-stub:')) {
    throw new Error('Encrypted payload is not in the expected PHI format.');
  }

  return decodeBase64(encrypted.replace('aes256-stub:', ''));
};

export const rotateAPIKey = (keyName: string): {
  keyName: string;
  previousRotationDate: string;
  nextRotationDate: string;
  newKey: string;
} => {
  if (!keyName.trim()) {
    throw new Error('Key name is required for rotation.');
  }

  const previousRotationDate = new Date();
  const nextRotationDate = new Date(previousRotationDate);
  nextRotationDate.setDate(previousRotationDate.getDate() + KEY_ROTATION_DAYS);

  return {
    keyName,
    previousRotationDate: previousRotationDate.toISOString(),
    nextRotationDate: nextRotationDate.toISOString(),
    newKey: `${keyName}_${encodeBase64(`${keyName}:${previousRotationDate.toISOString()}`)}`,
  };
};
