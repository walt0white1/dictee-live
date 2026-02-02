export type Submission = {
  pseudo: string;
  texte: string;
  score: number;
  erreurs: number;
  createdAt: number;
};


export type Session = {
  texteReference: string;
  submissions: Submission[];
  createdAt: number;
};
