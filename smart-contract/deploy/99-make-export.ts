import fs from "fs/promises";
import { DeployFunction } from "hardhat-deploy/types";

const deployFunction: DeployFunction = async function ({ run }) {
  run("export", { export: "../external-adapter/contracts/contract-info.json" });
  run("export", { export: "../web-app/contracts/contract-info.json" });

  await fs.cp("typechain-types/", "../web-app/typechain/", { recursive: true });
};

export default deployFunction;

deployFunction.id = "make_exports"; // id required to prevent reexecution
deployFunction.tags = ["Exports"];
