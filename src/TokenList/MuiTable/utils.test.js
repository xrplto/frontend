import React from 'react';

import { calcColumnWidth } from './utils';

describe('calcColumnWidth', () => {
  it('single column should equal table width', () => {
    const columns = [
      { name: 'name' }
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(tableWidth);
  });

  it('two columns should split table width equally (half)', () => {
    const columns = [
      { name: 'firstName' },
      { name: 'lastName' }
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(tableWidth/2);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(tableWidth/2);
  });

  it('three columns should split table width equally (thirds)', () => {
    const columns = [
      { name: 'firstName' },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(tableWidth/3);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(tableWidth/3);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(tableWidth/3);
  });

  it('single fixed column should allocate remaining widths to other non-fixed width columns', () => {
    const columns = [
      { name: 'firstName', width: 100 },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(100);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(200);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(200);
  });

  it('multiple fixed columns should allocate remaining widths to other non-fixed width columns', () => {
    const columns = [
      { name: 'firstName', width: 100 },
      { name: 'middleName', width: 100 },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(100);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(100);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(300);
  });

  it('column w/ minWidth defined that is smaller than distributed width should receive distributed width', () => {
    const columns = [
      { name: 'firstName', minWidth: 100 },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(tableWidth/3);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(tableWidth/3);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(tableWidth/3);
  });

  it('column w/ minWidth defined that is larger than distributed width should receive minWidth value', () => {
    const columns = [
      { name: 'firstName', minWidth: 100 },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 200;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(100);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(50);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(50);
  });

  it('should support columns with percentage based widths', () => {
    const columns = [
      { name: 'firstName', width: '50%' },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(250);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(125);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(125);
  });

  it('should distribute remaining width to undeclared columns when other columns use width and minWidth', () => {
    const columns = [
      { name: 'firstName', width: '50%' },
      { name: 'middleName', minWidth: 150 },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(250);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(150);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(100);
  });

  it('should use minWidth over percentage width when larger', () => {
    const columns = [
      { name: 'firstName', width: '50%', minWidth: 300 },
      { name: 'middleName' },
      { name: 'lastName' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(300);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(100);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(100);
  });

  it('should allow percentage widths to exceed table width (viewport) to support horizontal scrolling', () => {
    const columns = [
      { name: 'firstName', width: '50%' },
      { name: 'middleName', width: '50%' },
      { name: 'lastName', width: '50%' },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(250);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(250);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(250);
  });

  it('should allow fixed widths to exceed table width (viewport) to support horizontal scrolling', () => {
    const columns = [
      { name: 'firstName', width: 200 },
      { name: 'middleName', width: 200 },
      { name: 'lastName', width: 200 },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(200);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(200);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(200);
  });

  it('should allow minWidths to exceed table width (viewport) to support horizontal scrolling', () => {
    const columns = [
      { name: 'firstName', minWidth: 200 },
      { name: 'middleName', minWidth: 200 },
      { name: 'lastName', minWidth: 200 },
    ];
    const tableWidth = 500;
    expect(calcColumnWidth(0, columns, tableWidth)).toBe(200);
    expect(calcColumnWidth(1, columns, tableWidth)).toBe(200);
    expect(calcColumnWidth(2, columns, tableWidth)).toBe(200);
  });
});
