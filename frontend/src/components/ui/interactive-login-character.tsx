import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { OfficeBackground } from "./office-background";
import { Businessman } from "./businessman";
import { Desk } from "./desk";
import { cn } from "@/lib/utils";

export type CharacterState =
  | "idle"
  | "username-focus"
  | "typing"
  | "password-focus"
  | "password-typing"
  | "loading"
  | "success"
  | "error";

export type IdleAction = "none" | "coffee" | "look-around" | "notebook";

export interface InteractiveLoginCharacterProps {
  state: CharacterState;
  /** normalized cursor position over the form panel, 0..1 (defaults to centre) */
  mouseX?: number;
  mouseY?: number;
  className?: string;
}

const IDLE_ACTIONS: IdleAction[] = ["coffee", "look-around", "notebook"];

/**
 * Interactive login "executive assistant": a premium stylized businessman seated at a
 * desk in a modern office, built purely with SVG + Tailwind + Framer Motion (no Canvas,
 * no Three.js). He always sits on the LEFT; the login form sits on the RIGHT and he
 * looks toward it. Drive him with the `state` prop and the cursor position over the form.
 *
 * Responsive: fills its column (desktop ~50% / tablet ~40% of the page); on mobile the
 * host stacks this above the form. Decorative — marked aria-hidden; the form remains the
 * accessible control.
 */
function InteractiveLoginCharacterBase({
  state,
  mouseX = 0.5,
  mouseY = 0.5,
  className,
}: InteractiveLoginCharacterProps) {
  const reduced = useReducedMotion() ?? false;
  const [blink, setBlink] = useState(false);
  const [idleAction, setIdleAction] = useState<IdleAction>("none");

  // natural blinking every 3–6s
  useEffect(() => {
    if (reduced) return;
    let timer: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 130);
      timer = window.setTimeout(loop, 3000 + Math.random() * 3000);
    };
    timer = window.setTimeout(loop, 1800);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  // idle timeout: after 15s of idle, run a short ambient behavior, then return to idle
  useEffect(() => {
    if (state !== "idle" || reduced) {
      setIdleAction("none");
      return;
    }
    let i = 0;
    let clear: number;
    const tick = () => {
      const action = IDLE_ACTIONS[i % IDLE_ACTIONS.length];
      i += 1;
      setIdleAction(action);
      clear = window.setTimeout(() => setIdleAction("none"), 3400);
    };
    const id = window.setInterval(tick, 15000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(clear);
    };
  }, [state, reduced]);

  return (
    <div
      aria-hidden
      className={cn(
        "relative mx-auto w-full max-w-[560px] select-none",
        "aspect-[15/16]",
        className,
      )}
    >
      <OfficeBackground state={state} mouseX={mouseX} mouseY={mouseY} reduced={reduced} />

      <svg
        viewBox="0 0 600 640"
        className="absolute inset-0 h-full w-full drop-shadow-sm"
        style={{ overflow: "visible", willChange: "transform" }}
      >
        <Businessman
          state={state}
          mouseX={mouseX}
          mouseY={mouseY}
          blink={blink}
          idleAction={idleAction}
          reduced={reduced}
        />
        <Desk state={state} reduced={reduced} />
      </svg>
    </div>
  );
}

export const InteractiveLoginCharacter = memo(InteractiveLoginCharacterBase);
export default InteractiveLoginCharacter;
