import { mountWaterCaustics } from "water-caustics";

const defaults = {
  intensity: 1.2,
  speed: 1,
  scale: 1,
  tintStrength: 0.05,
};

const stage = document.querySelector<HTMLElement>("#stage");
const errorEl = document.querySelector<HTMLElement>("#error");
const toggle = document.querySelector<HTMLButtonElement>("#toggle");
const reset = document.querySelector<HTMLButtonElement>("#reset");

if (!stage || !errorEl || !toggle || !reset) {
  throw new Error("Demo markup is missing.");
}

const water = mountWaterCaustics(stage, {
  ...defaults,
  color: "#f8fff6",
  tint: "#3a8b8a",
  blendMode: "screen",
});

if (water.canvas.dataset.waterCaustics === "unsupported") {
  const reason = water.canvas.dataset.waterCausticsError;
  errorEl.hidden = false;
  if (reason) {
    errorEl.textContent = `The water overlay could not start (${reason}). The seafloor is still here — try a current browser with hardware acceleration on.`;
  }
}

const bindings = [
  ["intensity", "intensity", 2],
  ["speed", "speed", 2],
  ["scale", "scale", 2],
  ["tint", "tintStrength", 2],
] as const;

for (const [id, key, digits] of bindings) {
  const input = document.querySelector<HTMLInputElement>(`#${id}`);
  const output = document.querySelector<HTMLOutputElement>(`#${id}-out`);
  if (!input || !output) continue;
  input.addEventListener("input", () => {
    const value = Number(input.value);
    output.value = value.toFixed(digits);
    water.setOptions({ [key]: value });
    if (key === "speed") {
      toggle.textContent = value === 0 || water.paused ? "Resume" : "Pause";
    }
  });
}

toggle.addEventListener("click", () => {
  if (water.paused) {
    water.resume();
    toggle.textContent = "Pause";
  } else {
    water.pause();
    toggle.textContent = "Resume";
  }
});

reset.addEventListener("click", () => {
  water.setOptions(defaults);
  water.resume();
  toggle.textContent = "Pause";
  for (const [id, key, digits] of bindings) {
    const input = document.querySelector<HTMLInputElement>(`#${id}`);
    const output = document.querySelector<HTMLOutputElement>(`#${id}-out`);
    if (!input || !output) continue;
    const value = defaults[key];
    input.value = String(value);
    output.value = value.toFixed(digits);
  }
});
