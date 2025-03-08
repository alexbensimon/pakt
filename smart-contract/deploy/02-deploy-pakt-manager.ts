import { DeployFunction } from "hardhat-deploy/types";
import { networkConfig } from "../helper-hardhat-config";
import { verifyContract } from "../utils/verify-contract";

const deployFunction: DeployFunction = async function ({
  getNamedAccounts,
  deployments: { deploy, get, execute, read },
  network: {
    config: { chainId },
  },
}) {
  const { deployer } = await getNamedAccounts();

  const paktToken = await get("PaktToken");

  const { paktVerifier } = networkConfig[chainId as number];

  const args = [paktToken.address];

  const paktManager = await deploy("PaktManager", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: chainId === 1337 ? 0 : 5,
  });

  const minterRole = await read("PaktToken", { from: deployer }, "MINTER_ROLE");
  await execute(
    "PaktToken",
    { from: deployer },
    "grantRole",
    minterRole,
    paktManager.address,
  );

  const paktVerifierRole = await read(
    "PaktManager",
    { from: deployer },
    "PAKT_VERIFIER_ROLE",
  );
  await execute(
    "PaktManager",
    { from: deployer },
    "grantRole",
    paktVerifierRole,
    paktVerifier,
  );

  // No verification on dev chain
  if (chainId !== 1337) {
    await verifyContract(paktManager.address, args);
  }
};

export default deployFunction;

deployFunction.id = "deploy_pakt_manager"; // id required to prevent reexecution
deployFunction.tags = ["PaktManager"];
