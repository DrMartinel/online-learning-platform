export interface McqOption {
  label: string;  // e.g. "A", "B", "C", "D"
  text: string;   // Option content (supports LaTeX)
}

export class QuestionVariant {
  constructor(
    public id: string,
    public questionId: string,
    public variantIndex: number,
    public content: string,              // Question content (supports LaTeX)
    public options: McqOption[] | null,   // MCQ options, null for essay
    public correctAnswer: any | null,     // { index: number } for single, { indices: number[] } for multiple, null for essay
    public explanation: string | null,    // Answer explanation (supports LaTeX)
    public createdAt: Date,
  ) {}
}
