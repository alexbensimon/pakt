import { run } from "hardhat";

export async function verifyContract(address: string, args: Array<unknown>) {
  try {
    await run("verify:verify", {
      address,
      constructorArguments: args,
    });
  } catch (e: unknown) {
    console.log(e instanceof Error ? e.message : e);
  }
}
