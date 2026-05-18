/**
 * NeuralService.js
 *
 * Web Bluetooth gateway for BCI (Brain-Computer Interface) devices.
 * Connects to a hardware neural band, reads focus-level notifications,
 * and dispatches CustomEvents that the rest of Simplifii-OS responds to.
 *
 * Architecture:
 *   connectNeuralBand()  browser Bluetooth picker, GATT connect, subscribe
 *   disconnectNeuralBand() graceful teardown
 *   simulateFocusLevel() software-only testing harness (no hardware required)
 *
 * Events dispatched on window:
 *   simplifii:neural-band-connected   { deviceName: string }
 *   simplifii:neural-band-disconnected {}
 *   simplifii:focus-update            { focusPercent: number }
 *   simplifii:force-zen-mode          { reason: string, focusPercent: number }
 *
 * Device configuration:
 *   FOCUS_SERVICE_UUID and FOCUS_CHARACTERISTIC_UUID below are placeholder
 *   UUIDs. Real devices use proprietary GATT profiles:
 *     - Neurosity Crown: use @neurosity/sdk (Node.js; not Web Bluetooth)
 *     - Muse S/2: service 0xFE8D, characteristic varies by firmware
 *     - FRENZ Brainband: contact Earable for the developer UUID set
 *   Replace both constants with your target device UUIDs before pairing.
 *
 * Australian English. Zero em-dashes.
 */

// ============================================================
// Configuration (swap these for your target device)
// ============================================================

const FOCUS_SERVICE_UUID        = '0001cafe-0000-1000-8000-00805f9b34fb';
const FOCUS_CHARACTERISTIC_UUID = '0002cafe-0000-1000-8000-00805f9b34fb';

// Focus percentage below which FORCE_ZEN_MODE fires.
const FOCUS_THRESHOLD_ZEN = 30;

// ============================================================
// Module state (one active device per session)
// ============================================================

let _activeDevice         = null;
let _focusCharacteristic  = null;

// ============================================================
// Internal helpers
// ============================================================

const dispatchFocusEvent = (focusPercent) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('simplifii:focus-update', {
    detail: { focusPercent }
  }));
  if (focusPercent < FOCUS_THRESHOLD_ZEN) {
    window.dispatchEvent(new CustomEvent('simplifii:force-zen-mode', {
      detail: { reason: 'neural_focus_below_threshold', focusPercent }
    }));
  }
};

const parseFocusValue = (dataView) => {
  // Expects a single unsigned byte in the range 0 to 100.
  // Adjust this parser if your device uses a different encoding
  // (for example: uint16 little-endian, or a float scaled to 0 to 1).
  if (!dataView || dataView.byteLength < 1) return null;
  return Math.min(100, Math.max(0, dataView.getUint8(0)));
};

const onDisconnected = () => {
  _activeDevice        = null;
  _focusCharacteristic = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('simplifii:neural-band-disconnected', {}));
  }
};

// ============================================================
// Public API
// ============================================================

export const isNeuralBandSupported = () =>
  typeof navigator !== 'undefined' && 'bluetooth' in navigator;

/**
 * Opens the browser's Bluetooth device picker, connects to the first
 * device that advertises FOCUS_SERVICE_UUID, and starts receiving
 * focus-level notifications.
 *
 * Returns the device name string on success, or null if the user
 * cancelled the picker (not treated as an error).
 *
 * Throws if Bluetooth is unsupported or the GATT connection fails.
 */
export const connectNeuralBand = async () => {
  if (!isNeuralBandSupported()) {
    throw new Error(
      'Web Bluetooth is not supported in this browser. Use Chrome or Edge on a device with Bluetooth enabled.'
    );
  }
  if (_activeDevice?.gatt?.connected) return _activeDevice.name || 'Neural Band';

  let device;
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [FOCUS_SERVICE_UUID] }],
      optionalServices: [FOCUS_SERVICE_UUID]
    });
  } catch (err) {
    if (err.name === 'NotFoundError') return null; // user cancelled the picker
    throw err;
  }

  _activeDevice = device;
  device.addEventListener('gattserverdisconnected', onDisconnected);

  const server     = await device.gatt.connect();
  const service    = await server.getPrimaryService(FOCUS_SERVICE_UUID);
  _focusCharacteristic = await service.getCharacteristic(FOCUS_CHARACTERISTIC_UUID);

  await _focusCharacteristic.startNotifications();
  _focusCharacteristic.addEventListener('characteristicvaluechanged', (e) => {
    const focus = parseFocusValue(e.target.value);
    if (focus !== null) dispatchFocusEvent(focus);
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('simplifii:neural-band-connected', {
      detail: { deviceName: device.name || 'Neural Band' }
    }));
  }
  return device.name || 'Neural Band';
};

export const disconnectNeuralBand = async () => {
  if (_activeDevice?.gatt?.connected) {
    await _activeDevice.gatt.disconnect();
  }
  _activeDevice        = null;
  _focusCharacteristic = null;
};

/**
 * Software-only testing harness. Call this to simulate a focus reading
 * without hardware. Dispatches the same events as a real device would.
 *
 * simulateFocusLevel(25) triggers FORCE_ZEN_MODE.
 * simulateFocusLevel(75) triggers only the focus-update event.
 */
export const simulateFocusLevel = (focusPercent) => {
  dispatchFocusEvent(Math.min(100, Math.max(0, Number(focusPercent) || 0)));
};
