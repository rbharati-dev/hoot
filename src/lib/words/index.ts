// All the extra country word lists, by country code.
import type { Lang } from '../data';
import { WORDS as su } from './su';
import { WORDS as ca } from './ca';
import { WORDS as us } from './us';
import { WORDS as gb } from './gb';
import { WORDS as fr } from './fr';
import { WORDS as de } from './de';
import { WORDS as dd } from './dd';
import { WORDS as it } from './it';
import { WORDS as br } from './br';
import { WORDS as ar } from './ar';
import { WORDS as co } from './co';
import { WORDS as mx } from './mx';
import { WORDS as inn } from './in';
import { WORDS as np } from './np';

export const EXTRA: Record<string, Partial<Record<Lang, string>>> = { su, ca, us, gb, fr, de, dd, it, br, ar, co, mx, in: inn, np };
