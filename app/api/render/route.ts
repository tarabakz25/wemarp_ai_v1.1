import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

await execAsync(`marp input.md --images png --output ./output/`);
