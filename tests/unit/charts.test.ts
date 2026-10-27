import { describe, expect, it } from 'vitest';
import { parseHTML } from 'linkedom';
import { readTable, SOURCES } from '../../src/lib/wiki-core';

// Shape of the German/Italian/Argentine number-one tables on Wikipedia:
// date | "Song" | Artist, with date-only rows while a song stays at number one.
const html = `<section><table class="wikitable">
<tr><th>Issue date</th><th>Song</th><th>Artist</th></tr>
<tr><td>3 January</td><td>"<a rel="mw:WikiLink" href="./Tränen_lügen_nicht">Tränen lügen nicht</a>"</td><td><a rel="mw:WikiLink" href="./Michael_Holm">Michael Holm</a></td></tr>
<tr><td>10 January</td></tr>
<tr><td>17 January</td></tr>
<tr><td>24 January</td><td>"Paloma Blanca"</td><td><a rel="mw:WikiLink" href="./George_Baker_Selection">George Baker Selection</a></td></tr>
<tr><td>21 August</td><td>Some Artists</td></tr>
</table></section>`;

describe('chart tables', () => {
  it('reads each number-one once, skipping carry-over and malformed rows', () => {
    const doc = parseHTML(html).document as unknown as Document;
    const rows = readTable(doc.querySelector('section')!, 'rpm');
    expect(rows.map(r => r.title)).toEqual(['“Tränen lügen nicht” by Michael Holm', '“Paloma Blanca” by George Baker Selection']);
    expect(rows[1].links).toEqual(['George Baker Selection']); // no song link → fall back to the artist
    expect(rows[0].listen).toBe('Tränen lügen nicht Michael Holm');
  });

  it('never takes a Country column for the artist, and drops footnote marks', () => {
    const fr = `<section><table class="wikitable">
<tr><th>Date</th><th>Song</th><th>Country</th></tr>
<tr><td>5 January</td><td>"<a rel="mw:WikiLink" href="./Ghostbusters_(song)">Ghostbusters</a>"</td><td>U.S.</td></tr>
<tr><td>12 January</td><td>"Tarzan Boy‡"</td><td>Italy</td></tr>
</table></section>`;
    const doc = parseHTML(fr).document as unknown as Document;
    expect(readTable(doc.querySelector('section')!, 'rpm').map(r => r.title)).toEqual(['“Ghostbusters”', '“Tarzan Boy”']);

    const ca = `<section><table class="wikitable">
<tr><th>No.</th><th>Title</th><th>Artist(s)</th></tr>
<tr><th>1</th><td>"I Just Called to Say I Love You†"</td><td>Stevie Wonder</td></tr>
</table></section>`;
    const doc2 = parseHTML(ca).document as unknown as Document;
    expect(readTable(doc2.querySelector('section')!, 'songs').map(r => r.title)).toEqual(['“I Just Called to Say I Love You” by Stevie Wonder']);
  });

  it('has a music chart for Germany, France, Italy and Argentina', () => {
    for (const c of ['de', 'fr', 'it', 'ar']) expect(SOURCES[c].some(s => s.type === 'music'), c).toBe(true);
  });
});
