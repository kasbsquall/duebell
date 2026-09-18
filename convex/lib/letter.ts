// The written follow-up Duebell emails to the company from its inbox, on the user's behalf
// and only after they confirm. Spanish is what gets sent; English is a reference to read.
export type LetterLang = "es" | "en";

export interface LetterInput {
  companyName: string;
  referenceCode: string;
  filedDate: string;
  deadlineDate: string;
  summary: string;
  overdue: boolean;
}

export const LETTER_MAX_PER_CLAIM = 2;

export function letterSubject(input: LetterInput): string {
  return `Reclamo del Libro de Reclamaciones: requerimiento de respuesta [Ref ${input.referenceCode}]`;
}

export function buildLetter(input: LetterInput, lang: LetterLang): string {
  const { companyName, referenceCode, filedDate, deadlineDate, summary, overdue } = input;
  const lines =
    lang === "es"
      ? [
          `Señores de ${companyName}:`,
          `Me comunico por el reclamo que presenté en su Libro de Reclamaciones el ${filedDate} (referencia ${referenceCode}).`,
          `Hechos, en mis palabras: ${summary}`,
          overdue
            ? `El plazo legal de 15 días hábiles para responder venció el ${deadlineDate} sin una respuesta concreta.`
            : `El plazo legal de 15 días hábiles para responder vence el ${deadlineDate}.`,
          "Les pido una respuesta por escrito que indique la solución, el monto si corresponde, la fecha de cumplimiento y la persona responsable.",
          overdue
            ? "Si no recibo esa respuesta, presentaré el caso ante Indecopi."
            : "Si el plazo vence sin esa respuesta, presentaré el caso ante Indecopi.",
          `Por favor respondan a este mismo correo manteniendo la referencia ${referenceCode} en el asunto.`,
          "Enviado con Duebell a pedido del consumidor.",
        ]
      : [
          `To ${companyName}:`,
          `I am writing about the complaint I filed in your complaint book on ${filedDate} (reference ${referenceCode}).`,
          `Facts, in my words: ${summary}`,
          overdue
            ? `The 15 business day legal deadline to answer expired on ${deadlineDate} without a concrete answer.`
            : `The 15 business day legal deadline to answer ends on ${deadlineDate}.`,
          "I ask for a written answer stating the fix, the amount if any, the date it will happen and the person responsible.",
          overdue
            ? "If I do not receive that answer, I will take the case to Indecopi."
            : "If the deadline passes without that answer, I will take the case to Indecopi.",
          `Please reply to this same email and keep reference ${referenceCode} in the subject.`,
          "Sent with Duebell at the consumer's request.",
        ];
  return lines.join("\n\n");
}

// Deliberately strict: one plain address, no display names, no lists.
export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i.test(value);
}
