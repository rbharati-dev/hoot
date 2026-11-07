// Sexual-health content lives only under the Health tab's "Intimacy & desire"
// topic, never in "For you" or "New research". This flags it from the English
// text (translations share the flag), whatever topic it was filed under.
// "Sex" in the biological sense ("sex differences", "sex hormones") does not count.
const INTIMATE = /\b(sex(?![- ](differences?|difference|specific|based|hormones?|ratio|chromosomes?|and gender))|sexual(ly)?|sexuality|libido|erect(ion|ions|ile)|orgasms?|arous(al|ed)|intercourse|vagina[ls]?|vulva[rl]?|penis|penile|lubricants?|foreplay|intimacy|intimate|viagra|sildenafil|tadalafil|cialis|condoms?|STIs?|STDs?|porn\w*)\b/i;
export const isIntimate = (topic, ...texts) => topic === 'intimacy' || texts.some(t => INTIMATE.test(t || ''));
