export type Instruction =
  | { op: 'LOAD'; register: 0 | 1; value: number }
  | { op: 'ADD' | 'MUL'; register: 0 | 1; from: 0 | 1 }
  | { op: 'EMIT'; register: 0 | 1 }
  | { op: 'HALT' };
export type Machine = { pc: number; registers: [number, number]; output: number[]; halted: boolean };
export const initial = (): Machine => ({ pc: 0, registers: [0, 0], output: [], halted: false });
export const programs: Instruction[][] = [
  [{ op: 'LOAD', register: 0, value: 3 }, { op: 'LOAD', register: 1, value: 7 }, { op: 'ADD', register: 0, from: 1 }, { op: 'LOAD', register: 1, value: 2 }, { op: 'MUL', register: 0, from: 1 }, { op: 'EMIT', register: 0 }, { op: 'HALT' }],
  [{ op: 'LOAD', register: 0, value: 4 }, { op: 'LOAD', register: 1, value: 3 }, { op: 'MUL', register: 0, from: 1 }, { op: 'EMIT', register: 0 }, { op: 'HALT' }],
];
export function execute(state: Machine, program: Instruction[]): Machine {
  if (state.halted) return state;
  const instruction = program[state.pc] ?? { op: 'HALT' as const };
  const next: Machine = { pc: state.pc + 1, registers: [...state.registers], output: [...state.output], halted: false };
  if (instruction.op === 'LOAD') next.registers[instruction.register] = instruction.value;
  if (instruction.op === 'ADD') next.registers[instruction.register] += next.registers[instruction.from];
  if (instruction.op === 'MUL') next.registers[instruction.register] *= next.registers[instruction.from];
  if (instruction.op === 'EMIT') next.output.push(next.registers[instruction.register]);
  if (instruction.op === 'HALT') { next.halted = true; next.pc = state.pc; }
  return next;
}
export function instructionText(instruction: Instruction) {
  if (instruction.op === 'HALT') return 'HALT';
  if (instruction.op === 'LOAD') return `LOAD  R${instruction.register}, ${instruction.value}`;
  if (instruction.op === 'EMIT') return `EMIT  R${instruction.register}`;
  return `${instruction.op.padEnd(5)} R${instruction.register}, R${instruction.from}`;
}
export function phase(instruction?: Instruction) {
  if (!instruction || instruction.op === 'LOAD') return 0;
  if (instruction.op === 'ADD' || instruction.op === 'MUL') return 1;
  return 2;
}
