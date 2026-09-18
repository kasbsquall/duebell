// Short English labels for Indecopi's Spanish offense names, so English-speaking
// users can read a company's record. Falls back to the original text on any failure.

const MODEL = "gpt-5.4-mini-2026-03-17";

export async function translateOffenses(offenses: string[]): Promise<string[]> {
  if (offenses.length === 0) return [];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "Translate Peruvian consumer-protection offense names into short, plain English labels (max 8 words, sentence case). Keep the same order and count.",
          },
          { role: "user", content: JSON.stringify(offenses) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "offense_translations",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["labels"],
              properties: { labels: { type: "array", items: { type: "string" } } },
            },
          },
        },
      }),
    });
    if (!res.ok) return offenses;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const labels = JSON.parse(body.choices?.[0]?.message?.content ?? "{}").labels as unknown;
    if (!Array.isArray(labels) || labels.length !== offenses.length) return offenses;
    return labels.map((label, i) => (typeof label === "string" && label.trim() ? label.trim() : offenses[i]));
  } catch {
    return offenses;
  }
}
