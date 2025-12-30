/**
 * Decodes a base64 string into a Uint8Array of bytes.
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (16-bit little-endian) into an AudioBuffer.
 * This is specific to how Gemini API returns audio data.
 */
export async function decodeAudioData(
  base64String: string,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const bytes = decodeBase64(base64String);
  
  // Create an Int16Array view of the data to parse 16-bit PCM
  const dataInt16 = new Int16Array(bytes.buffer);
  
  // Calculate the total number of frames (samples per channel)
  const frameCount = dataInt16.length / numChannels;
  
  // Create the AudioBuffer
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  // Fill the buffer channels
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit integer (-32768 to 32767) to float (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  return buffer;
}