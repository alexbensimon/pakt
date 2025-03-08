import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { deployments } from "hardhat";
import { PaktToken } from "../typechain-types";

const setupContract = deployments.createFixture(
  async ({ deployments, ethers }) => {
    await deployments.fixture(["PaktToken"]);

    const [owner, other] = await ethers.getSigners();

    const paktToken = (await ethers.getContract(
      "PaktToken",
      owner,
    )) as PaktToken;

    return {
      signers: { owner, other },
      paktToken,
    };
  },
);

describe("PaktToken", () => {
  it("only allows to transfer when unpaused", async () => {
    const {
      paktToken,
      signers: { owner, other },
    } = await setupContract();

    const AMOUNT = parseEther("1000");

    const [ownerBalanceBefore, otherBalanceBefore] = await Promise.all([
      paktToken.balanceOf(owner.address),
      paktToken.balanceOf(other.address),
    ]);

    await paktToken.connect(owner).pause();

    await expect(
      paktToken.connect(owner).transfer(other.address, AMOUNT),
    ).to.be.revertedWith("Pausable: paused");

    await paktToken.connect(owner).unpause();

    await paktToken.connect(owner).transfer(other.address, AMOUNT);

    const [ownerBalanceAfter, otherBalanceAfter] = await Promise.all([
      paktToken.balanceOf(owner.address),
      paktToken.balanceOf(other.address),
    ]);

    expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.sub(AMOUNT));
    expect(otherBalanceAfter).to.equal(otherBalanceBefore.add(AMOUNT));
  });

  it("doesn't allow an address without pauser role to pause", async () => {
    const {
      paktToken,
      signers: { other },
    } = await setupContract();

    await expect(paktToken.connect(other).pause()).to.be.reverted;
  });

  it("doesn't allow an address without pauser role to unpause", async () => {
    const {
      paktToken,
      signers: { other },
    } = await setupContract();

    await expect(paktToken.connect(other).unpause()).to.be.reverted;
  });

  it("doesn't allow an address without minter role to mint", async () => {
    const {
      paktToken,
      signers: { other },
    } = await setupContract();

    await expect(
      paktToken.connect(other).mint(other.address, parseEther("1000")),
    ).to.be.reverted;
  });
});
