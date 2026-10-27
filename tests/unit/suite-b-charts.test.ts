import { describe, expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import { readTable } from '../../src/lib/wiki-core';

const read = (html: string, kind: 'songs' | 'rpm') => {
  const doc = parseHTML(`<section>${html}</section>`).document as unknown as Document;
  return readTable(doc.querySelector('section')!, kind);
};
const titles = (html: string, kind: 'songs' | 'rpm' = 'songs') => read(html, kind).map(r => r.title);
const table = (rows: string[], head = '<tr><th>No.</th><th>Title</th><th>Artist</th></tr>') => `<table class="wikitable">${head}${rows.join('')}</table>`;
const row = (n: number | string, song: string, artist: string) => `<tr><td>${n}</td><td>${song}</td><td>${artist}</td></tr>`;

describe('quotes of all kinds', () => {
  it.each([
    ['straight', '"Yesterday"'], ['curly', '“Yesterday”'], ['mixed open straight close curly', '"Yesterday”'], ['mixed open curly close straight', '“Yesterday"'],
  ])('%s quotes are stripped and normalised', (_n, cell) => {
    for (const kind of ['songs', 'rpm'] as const) expect(titles(table([row(1, cell, 'The Beatles')]), kind)).toEqual(['“Yesterday” by The Beatles']);
  });
  it('quotes inside a title are removed too', () => {
    expect(titles(table([row(1, '"The "Best" Song"', 'X')]))).toEqual(['“The Best Song” by X']);
  });
  it('rows whose song cell does not start with a quote are skipped', () => {
    expect(titles(table([row(1, 'Yesterday', 'The Beatles'), row(2, '"Help!"', 'The Beatles')]))).toEqual(['“Help!” by The Beatles']);
  });
  it('quote after leading whitespace still counts', () => {
    expect(titles(table([row(1, '  "Hey Jude"  ', 'The Beatles')]))).toEqual(['“Hey Jude” by The Beatles']);
  });
});

describe('header-based artist column', () => {
  it.each(['Artist', 'Artist(s)', 'Artists', 'Performer', 'Performer(s)', 'Interpreter', 'Singer', 'Band', 'Act'])('"%s" header', h => {
    for (const kind of ['songs', 'rpm'] as const)
      expect(titles(table([row(1, '"S"', 'Someone')], `<tr><th>No.</th><th>Song</th><th>${h}</th></tr>`), kind)).toEqual(['“S” by Someone']);
  });
  it('artist column may be before the song column', () => {
    const t = `<table class="wikitable"><tr><th>Date</th><th>Artist</th><th>Song</th></tr><tr><td>1 May</td><td>Abba</td><td>"Waterloo"</td></tr></table>`;
    expect(titles(t)).toEqual(['“Waterloo” by Abba']);
  });
  it('column index is by header position even with a wide table', () => {
    const t = `<table class="wikitable"><tr><th>Week</th><th>Date</th><th>Song</th><th>Weeks</th><th>Artist</th></tr><tr><td>1</td><td>2 Jan</td><td>"S"</td><td>3</td><td>Real Artist</td></tr></table>`;
    expect(titles(t)).toEqual(['“S” by Real Artist']);
  });
  it.each(['Country', 'Origin', 'Nation'])('without an artist header (%s column) no artist is invented', h => {
    const t = `<table class="wikitable"><tr><th>Date</th><th>Song</th><th>${h}</th></tr><tr><td>5 Jan</td><td>"Ghostbusters"</td><td>U.S.</td></tr></table>`;
    for (const kind of ['songs', 'rpm'] as const) expect(titles(t, kind)).toEqual(['“Ghostbusters”']);
  });
  it('Country column ignored when an Artist column exists too', () => {
    const t = `<table class="wikitable"><tr><th>Date</th><th>Song</th><th>Country</th><th>Artist</th></tr><tr><td>5 Jan</td><td>"S"</td><td>Italy</td><td>Raf</td></tr></table>`;
    expect(titles(t)).toEqual(['“S” by Raf']);
  });
  it('headerless table falls back to the cell after the song', () => {
    const t = `<table class="wikitable"><tr><td>1</td><td>"S"</td><td>Next Cell</td></tr></table>`;
    expect(titles(t)).toEqual(['“S” by Next Cell']);
  });
  it('title in a th row cell (No. as th) works', () => {
    const t = `<table class="wikitable"><tr><th>No.</th><th>Title</th><th>Artist</th></tr><tr><th>1</th><td>"S"</td><td>A</td></tr></table>`;
    expect(titles(t)).toEqual(['“S” by A']);
  });
  it('listen text is song + artist', () => {
    expect(read(table([row(1, '"S"', 'A B')]), 'songs')[0].listen).toBe('S A B');
  });
});

describe('footnote marks', () => {
  it.each(['†', '‡', '*', '§', '¶', '†‡', '**'])('mark %s is dropped from song and artist', mark => {
    expect(titles(table([row(1, `"Song${mark}"`, `Artist${mark}`)]))).toEqual(['“Song” by Artist']);
  });
  it.each(['[a]', '[1]', '[note 12]'])('bracketed note %s is dropped', mark => {
    expect(titles(table([row(1, `"Song"${mark}`, `Artist${mark}`)]))).toEqual(['“Song” by Artist']);
  });
  it('mark after the closing quote is dropped', () => {
    expect(titles(table([row(1, '"Song"†', 'Artist')]))).toEqual(['“Song” by Artist']);
  });
});

describe('rowspan carry-over rows and duplicates', () => {
  it('date-only rows are skipped', () => {
    const head = '<tr><th>Date</th><th>Song</th><th>Artist</th></tr>';
    const rows = ['<tr><td>3 Jan</td><td>"A"</td><td>X</td></tr>', '<tr><td>10 Jan</td></tr>', '<tr><td>17 Jan</td></tr>', '<tr><td>24 Jan</td><td>"B"</td><td>Y</td></tr>'];
    expect(titles(table(rows, head))).toEqual(['“A” by X', '“B” by Y']);
  });
  it('rows with a rowspan-shortened artist shift to the right column', () => {
    // Year cell is rowspanned: later rows have one fewer cell than the header.
    const head = '<tr><th>Year</th><th>Song</th><th>Artist</th></tr>';
    const rows = ['<tr><td rowspan="2">1970</td><td>"A"</td><td>X</td></tr>', '<tr><td>"B"</td><td>Y</td></tr>'];
    expect(titles(table(rows, head))).toEqual(['“A” by X', '“B” by Y']);
  });
  it('duplicate songs are dropped (first kept), also across quote styles', () => {
    expect(titles(table([row(1, '"Dup"', 'First'), row(2, '“Dup”', 'Second'), row(3, '"Other"', 'Z')]))).toEqual(['“Dup” by First', '“Other” by Z']);
  });
  it('duplicates are dropped across multiple tables', () => {
    expect(titles(table([row(1, '"A"', 'X')]) + table([row(1, '"A"', 'Y'), row(2, '"B"', 'Y')]))).toEqual(['“A” by X', '“B” by Y']);
  });
  it('rows with fewer than two cells are skipped', () => {
    expect(titles(table(['<tr><td>"Alone"</td></tr>', row(1, '"A"', 'X')]))).toEqual(['“A” by X']);
  });
  it('tables that are not wikitables are ignored', () => {
    expect(titles(`<table>${row(1, '"A"', 'X')}</table>`)).toEqual([]);
  });
  it('empty song after cleaning is skipped', () => {
    expect(titles(table([row(1, '"†"', 'X'), row(2, '"A"', 'X')]))).toEqual(['“A” by X']);
  });
});

describe('links', () => {
  it('song link preferred; artist link used for the photo', () => {
    const r = read(table([row(1, '"<a rel="mw:WikiLink" href="./Hey_Jude">Hey Jude</a>"', '<a rel="mw:WikiLink" href="./The_Beatles">The Beatles</a>')]), 'songs')[0];
    expect(r.links).toEqual(['Hey Jude']);
    expect(r.photo).toEqual(['The Beatles']);
  });
  it('without a song link the artist link is used', () => {
    const r = read(table([row(1, '"Hey Jude"', '<a rel="mw:WikiLink" href="./The_Beatles">The Beatles</a>')]), 'songs')[0];
    expect(r.links).toEqual(['The Beatles']);
  });
  it('non-WikiLink anchors are ignored', () => {
    const r = read(table([row(1, '"<a href="http://x">S</a>"', 'A')]), 'songs')[0];
    expect(r.links).toEqual([]);
  });
});
