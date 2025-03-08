import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { verifyContract } from "../utils/verify-contract";

const deployFunction: DeployFunction = async function ({
  getNamedAccounts,
  deployments: { deploy },
  network: {
    config: { chainId },
  },
}) {
  const { deployer } = await getNamedAccounts();

  const initialSupply = ethers.utils.parseEther("5000000");

  const args = [initialSupply];

  const paktToken = await deploy("PaktToken", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: chainId === 1337 ? 0 : 5,
  });

  // No verification on dev chain
  if (chainId !== 1337) {
    await verifyContract(paktToken.address, args);
  }
};

export default deployFunction;

deployFunction.id = "deploy_pakt_token"; // id required to prevent reexecution
deployFunction.tags = ["PaktToken"];
