// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the AudioContext and related Web Audio API functionality
class MockAudioContext {
  createBufferSource() {
    return {
      connect: jest.fn(),
      start: jest.fn(),
      buffer: null,
      playbackRate: { value: 1 }
    };
  }
  
  createGain() {
    return {
      connect: jest.fn(),
      gain: { value: 1 }
    };
  }
  
  decodeAudioData() {
    return Promise.resolve({});
  }
  
  get destination() {
    return {};
  }
}

// Add AudioContext to the global object
global.AudioContext = MockAudioContext as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = jest.fn();

// Mock canvas functionality
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  textAlign: '',
  textBaseline: '',
  font: '',
  strokeRect: jest.fn(),
  setLineDash: jest.fn()
}));
