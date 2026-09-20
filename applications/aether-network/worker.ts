import { startFleet } from "./src/lib/agents/fleet";

console.log("Aether agents worker starting (never launch Solari inside Next requests)");

void startFleet().catch((error) => {
  console.error(error);
  process.exit(1);
});
