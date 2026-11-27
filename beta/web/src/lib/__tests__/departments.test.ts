// Run with: node src/lib/__tests__/departments.test.ts   (Node 22.6+ strips the types)
import { deriveDepartment, researcherDepartment } from '../departments.ts';

const cases: [string, string, string][] = [
  // [raw affiliation string, expected department, expected method]
  ['Department of Psychology, Halden Institute of Technology, Halden, Germany', 'Psychology', 'unit'],
  ['Dept. of Economics, Halden Inst. of Technol., Halden', 'Economics', 'unit'],
  ['Fakultät für Psychologie, Halden Institute of Technology, Halden', 'Psychology', 'unit'],
  ['Fachbereich Kognitionswissenschaft, Halden Institute of Technology', 'Cognitive Science', 'unit'],
  ['Abteilung Soziologie, Mirovia Inst., Vienna Woods', 'Sociology', 'unit'],
  ['Afdeling Sociale Psychologie, Rijnmond University, Rijnmond', 'Psychology', 'unit'],
  ['Afdeling Onderwijswetenschappen, Rijnmond University', 'Education', 'unit'],
  ['Sociology Unit, Mirovia Institute for Social Research, Austria', 'Sociology', 'unit'],
  ['Fac. de Economia, Univ. de Vale Alto, Vale Alto', 'Economics', 'unit'],
  ['Instituto de Psicologia, Universidade de Vale Alto, Brazil', 'Psychology', 'unit'],
  ['教育学研究科, Kawanami University, Kawanami', 'Education', 'unit'],
  ['心理学専攻, Kawanami University', 'Psychology', 'unit'],
  ['Grad. Sch. of Education, Kawanami Univ., Kawanami', 'Education', 'unit'],
  ['Department of Social Psychology, Rijnmond University', 'Psychology', 'unit'],   // not Sociology
  ['Department of Cognitive Science, Halden Institute of Technology', 'Cognitive Science', 'unit'], // not Psychology
  ['School of Public Health, Pacifica Coast University', 'Health Sciences', 'unit'],
  ['Psychology, Halden Institute of Technology, Germany', 'Psychology', 'keyword'],
  ['Halden Institute of Technology, Halden, Germany', 'Unassigned', 'unassigned'],
  ['Greywater College, Greywater, United Kingdom', 'Unassigned', 'unassigned'],       // "College" alone is not a department
  ['Mirovia Institute for Social Research, Vienna Woods, Austria', 'Unassigned', 'unassigned'],
];

let failed = 0;
for (const [raw, dept, method] of cases) {
  const m = deriveDepartment(raw);
  const ok = m.department === dept && m.method === method;
  if (!ok) { failed++; console.log(`FAIL  ${raw}\n      got ${m.department} (${m.method}), expected ${dept} (${method})`); }
}
// Majority vote across a researcher's strings, ignoring ones that cannot be placed.
const r = researcherDepartment(['Halden Institute of Technology, Halden', 'Dept. of Economics, Halden Inst.', 'Economics, Halden Institute of Technology']);
if (r.department !== 'Economics') { failed++; console.log(`FAIL  majority vote: got ${r.department}`); }

// Throwing exits Node with a non-zero code, so `npm test` fails in CI.
if (failed) throw new Error(`${failed} of ${cases.length + 1} checks failed`);
console.log(`all ${cases.length + 1} checks passed`);
