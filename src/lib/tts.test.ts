import { describe, expect, it } from 'vitest';
import { splitDialog } from './tts';

describe('splitDialog', () => {
  it('memecah percakapan A dan B menjadi baris per pembicara', () => {
    expect(splitDialog('A: What is in the box? B: There are three books and an old clock.')).toEqual([
      { speaker: 'A', text: 'What is in the box?' },
      { speaker: 'B', text: 'There are three books and an old clock.' },
    ]);
  });

  it('mengenali label berupa kata dan pembicara yang bergantian', () => {
    expect(splitDialog('Staff: Good morning. Student: Hi, I need a form. Staff: Here it is.')).toEqual([
      { speaker: 'Staff', text: 'Good morning.' },
      { speaker: 'Student', text: 'Hi, I need a form.' },
      { speaker: 'Staff', text: 'Here it is.' },
    ]);
  });

  it('membiarkan monolog yang memakai titik dua sebagai satu baris', () => {
    const script = 'The exam has three parts: listening, reading, and writing. Each part takes thirty minutes.';
    expect(splitDialog(script)).toEqual([{ speaker: '', text: script }]);
    expect(splitDialog("Let's be realistic: the deadline is unlikely to change.")).toHaveLength(1);
  });
});
