import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const DEMO_CLAIM = {
  companyName: "Saga Falabella",
  summary: "I returned a jacket on September 2 and the PEN 389 refund never reached my card.",
};

interface NewClaimProps {
  onCreated: (id: Id<"claims">) => void;
}

export function NewClaim({ onCreated }: NewClaimProps) {
  const create = useMutation(api.claims.create);
  const [companyName, setCompanyName] = useState("");
  const [companyRuc, setCompanyRuc] = useState("");
  const [summary, setSummary] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: { companyName: string; summary: string; companyRuc?: string }) {
    setPending(true);
    setError(null);
    try {
      onCreated(await create(values));
    } catch {
      setError("We could not save the complaint. Check the fields and try again.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (companyRuc && !/^\d{11}$/.test(companyRuc)) {
      setError("A RUC has 11 digits. Leave it empty if you do not know it.");
      return;
    }
    void submit({ companyName, summary, companyRuc: companyRuc || undefined });
  }

  return (
    <section className="intro">
      <div className="intro__pitch">
        <p className="eyebrow">For consumers in Peru</p>
        <h1 className="intro__title">
          The company has <span className="num">15</span> business days to answer you.
          <br />
          We keep the clock.
        </h1>
        <p className="intro__lede">
          File your complaint in the company's official complaint book (the Libro de Reclamaciones)
          with our address as your contact. We count the legal deadline, read every reply, tell you
          when it is a non-answer, and draft your case for Indecopi, Peru's consumer protection
          agency, when they stall.
        </p>
        <button className="btn btn--quiet" onClick={() => void submit(DEMO_CLAIM)} disabled={pending}>
          <Sparkle size={16} weight="light" aria-hidden />
          Try it with a sample complaint
        </button>
      </div>

      <form className="panel intro__form" onSubmit={onSubmit}>
        <p className="eyebrow">New complaint</p>
        <label>
          <span>Company</span>
          <input
            required
            maxLength={200}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Saga Falabella"
          />
        </label>
        <label>
          <span>
            RUC <span className="muted">(optional, 11 digits)</span>
          </span>
          <input
            inputMode="numeric"
            value={companyRuc}
            onChange={(e) => setCompanyRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="20100128056"
            className="num"
          />
        </label>
        <label>
          <span>What happened</span>
          <textarea
            required
            maxLength={2000}
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What you paid for, what went wrong, what you asked for."
          />
        </label>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary" type="submit" disabled={pending}>
          {pending ? "Starting the clock…" : "Start the clock"}
          <ArrowRight size={16} weight="light" aria-hidden />
        </button>
      </form>
    </section>
  );
}
