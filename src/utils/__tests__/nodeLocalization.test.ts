import { describe, it, expect } from 'vitest';
import { getComponentDisplayName } from '../nodeLocalization';
import { CircuitElementData } from '../../types/circuit';

describe('nodeLocalization - getComponentDisplayName', () => {
  it('localizes battery holder labels correctly between ID and EN', () => {
    const holderData: Partial<CircuitElementData> = {
      type: 'battery-holder',
      label: 'Wadah AA (3.0V)',
      voltage: 3.0,
      batteryCount: 2,
    };

    expect(getComponentDisplayName(holderData, 'id')).toBe('Wadah AA (3.0V)');
    expect(getComponentDisplayName(holderData, 'en')).toBe('2× AA Holder (3.0V)');
  });

  it('translates known Indonesian system default labels to English', () => {
    expect(
      getComponentDisplayName({ type: 'switch', label: 'Saklar Utama' }, 'en')
    ).toBe('Main Switch');

    expect(
      getComponentDisplayName({ type: 'switch', label: 'Saklar Utama' }, 'id')
    ).toBe('Saklar Utama');

    expect(
      getComponentDisplayName({ type: 'battery', label: 'Baterai AA 1.5V' }, 'en')
    ).toBe('1.5V AA Battery');

    expect(
      getComponentDisplayName({ type: 'socket', label: 'Fiting + Lampu Pijar' }, 'en')
    ).toBe('Socket + Incandescent Bulb');

    expect(
      getComponentDisplayName({ type: 'waypoint', label: 'Sudut Kanan Bawah' }, 'en')
    ).toBe('Bottom Right Corner');

    expect(
      getComponentDisplayName({ type: 'voltmeter', label: 'Voltmeter Utama' }, 'en')
    ).toBe('Main Voltmeter');
  });

  it('translates dynamic numbered components correctly', () => {
    expect(
      getComponentDisplayName({ type: 'socket', label: 'Fiting + Lampu Pijar 2' }, 'en')
    ).toBe('Socket + Incandescent Bulb 2');

    expect(
      getComponentDisplayName({ type: 'socket', label: 'Socket + Incandescent Bulb 3' }, 'id')
    ).toBe('Fiting + Lampu Pijar 3');

    expect(
      getComponentDisplayName({ type: 'waypoint', label: 'Simpul Atas 1' }, 'en')
    ).toBe('Top Rail Node 1');
  });

  it('falls back to component catalog when label is empty or generic type name', () => {
    expect(
      getComponentDisplayName({ type: 'resistor', label: '' }, 'id')
    ).toBe('Resistor');

    expect(
      getComponentDisplayName({ type: 'battery', label: 'battery' }, 'en')
    ).toBe('AA Battery');
  });

  it('preserves user custom-defined labels verbatim', () => {
    const customUserLabel = 'Lampu Kamar Tidur Utama';
    expect(
      getComponentDisplayName({ type: 'socket', label: customUserLabel }, 'en')
    ).toBe(customUserLabel);

    expect(
      getComponentDisplayName({ type: 'socket', label: customUserLabel }, 'id')
    ).toBe(customUserLabel);
  });

  it('handles null and undefined gracefully without throwing', () => {
    expect(getComponentDisplayName(null, 'id')).toBe('Komponen');
    expect(getComponentDisplayName(null, 'en')).toBe('Component');
    expect(getComponentDisplayName(undefined, 'en')).toBe('Component');
  });

  it('localizes Nature Mode 4.0 outdoor components between ID and EN', () => {
    expect(
      getComponentDisplayName({ type: 'bess-substation', label: 'Gardu Baterai BESS' }, 'en')
    ).toBe('BESS Battery Substation');
    expect(
      getComponentDisplayName({ type: 'bess-substation', label: 'BESS Battery Substation' }, 'id')
    ).toBe('Gardu Baterai BESS');

    expect(
      getComponentDisplayName({ type: 'hydro-turbine', label: 'Turbin Mikrohidro' }, 'en')
    ).toBe('Micro-Hydro Turbine');
    expect(
      getComponentDisplayName({ type: 'hydro-turbine', label: 'Micro-Hydro Turbine' }, 'id')
    ).toBe('Turbin Mikrohidro');

    expect(
      getComponentDisplayName({ type: 'transmission-tower', label: 'Gardu Trafo SUTET' }, 'en')
    ).toBe('SUTET Pole Transformer');
  });
});
