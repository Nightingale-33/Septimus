// builder.ts - Updated to support server selection
import * as esbuild from "esbuild";
import { spawn } from "child_process";

async function startWatch() {
  const serverName = process.argv[2] || "main"; // default to main server

  const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outdir: "dist",
    format: "cjs",
    platform: "node",
    sourcemap: false,
    target: "node24",
    plugins: [
      {
        name: "rebuild-notifier",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) {
              console.error("❌ Build failed", result.errors);
            } else {
              console.log("✅ Build succeeded, uploading...");
              runUpload(serverName);
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log(`👀 Watching for changes... (uploading to '${serverName}')`);
}

function runUpload(serverName: string) {
  const child = spawn("npm", ["run", "upload", serverName], {
    stdio: "inherit",
    shell: true,
  });
  child.on("close", (code: number) => {
    if (code !== 0) {
      console.error("⚠ Upload failed with code", code);
    }
  });
}

startWatch().catch((e) => {
  console.error(e);
  process.exit(1);
});
