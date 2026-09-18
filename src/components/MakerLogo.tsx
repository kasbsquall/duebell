import type { Maker } from "../demo/timeline";
import { BellMark } from "./Logo";

const SRC: Record<Exclude<Maker, "duebell">, string> = {
  convex: "/logos/convex.svg",
  firecrawl: "/logos/firecrawl.png",
  agentmail: "/logos/agentmail.png",
  openai: "/logos/openai.svg",
};

// The system that performs a step, shown by its own mark next to its name.
export function MakerLogo({ maker, size = 14 }: { maker: Maker; size?: number }) {
  if (maker === "duebell") return <BellMark size={size} className="maker-logo" />;
  return <img className="maker-logo" src={SRC[maker]} width={size} height={size} alt="" aria-hidden />;
}
