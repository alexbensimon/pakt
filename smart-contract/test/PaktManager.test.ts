import { expect } from "chai";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { deployments, ethers, network } from "hardhat";
import {
  PaktManager,
  PaktToken,
  WithdrawContractTest,
} from "../typechain-types";

const SOURCE_ID = 1234;

const setupContracts = deployments.createFixture(
  async ({ deployments, ethers }) => {
    await deployments.fixture(); // ensure you start from a fresh deployments

    const [owner, verifier, user, user2] = await ethers.getSigners();

    const [paktToken, paktManager] = (await Promise.all([
      ethers.getContract("PaktToken", owner),
      ethers.getContract("PaktManager", owner),
    ])) as [PaktToken, PaktManager];

    // give some PAKT tokens to user
    await paktToken.transfer(user.address, parseEther("5000"));

    return {
      signers: { owner, verifier, user, user2 },
      paktToken,
      paktManager,
    };
  },
);

const setupWalletLink = deployments.createFixture(async () => {
  const args = await setupContracts();
  const {
    signers: { verifier, user },
    paktManager,
  } = args;

  await paktManager
    .connect(verifier)
    .linkWalletAndSourceId(user.address, SOURCE_ID);

  return args;
});

const setupPakt = deployments.createFixture(async () => {
  const args = await setupWalletLink();
  const {
    signers: { user },
    paktManager,
    paktToken,
  } = args;

  // approve
  await paktToken.connect(user).approve(paktManager.address, parseEther("300"));

  await paktManager.connect(user).makeNewPakt(1, 3, parseEther("100"), "");

  return args;
});

const setupCustomPakt = deployments.createFixture(async () => {
  const args = await setupWalletLink();
  const {
    signers: { user },
    paktManager,
    paktToken,
  } = args;

  // approve
  await paktToken
    .connect(user)
    .approve(paktManager.address, parseEther("1000"));

  await paktManager
    .connect(user)
    .makeNewPakt(0, 0, parseEther("100"), "Custom pakt");

  return args;
});

const setupPaktInactive = deployments.createFixture(async () => {
  const args = await setupWalletLink();
  const {
    signers: { user },
    paktManager,
    paktToken,
  } = args;

  // approve
  await paktToken
    .connect(user)
    .approve(paktManager.address, parseEther("1000"));

  await paktManager.connect(user).makeNewPakt(1, 1, parseEther("100"), "");

  // wait for one week
  await network.provider.send("evm_increaseTime", [
    await paktManager.PAKT_DURATION(),
  ]);
  await network.provider.send("evm_mine");

  await paktManager.connect(user).failPakt(0);

  return args;
});

const setupPaktVerified = deployments.createFixture(async () => {
  const args = await setupPakt();
  const {
    signers: { user, verifier },
    paktManager,
  } = args;

  // wait for one week
  await network.provider.send("evm_increaseTime", [
    await paktManager.PAKT_DURATION(),
  ]);
  await network.provider.send("evm_mine");

  await paktManager.connect(verifier).markPaktVerified(user.address, 0);

  return args;
});

const setupPaktUnlocked = deployments.createFixture(async () => {
  const args = await setupPaktVerified();
  const {
    signers: { user },
    paktManager,
  } = args;

  await paktManager
    .connect(user)
    .unlockFunds(0, { value: await paktManager.s_unlockFundsFee() });

  return args;
});

describe("PaktManager", () => {
  describe("linkWalletAndSourceId", () => {
    it("allows the verifier to link wallet and sourceId", async () => {
      const {
        signers: { verifier, user },
        paktManager,
      } = await setupContracts();

      expect(
        await paktManager
          .connect(verifier)
          .linkWalletAndSourceId(user.address, SOURCE_ID),
      )
        .to.emit(paktManager, "WalletAndSourceIdLinked")
        .withArgs(user.address, SOURCE_ID);

      const [sourceId, wallet] = await Promise.all([
        paktManager.s_walletToSourceId(user.address),
        paktManager.s_sourceIdToWallet(SOURCE_ID),
      ]);

      expect(sourceId).to.equal(SOURCE_ID);
      expect(wallet).to.equal(user.address);
    });

    it("doesn't allow to link a wallet already linked", async () => {
      const {
        signers: { verifier, user },
        paktManager,
      } = await setupWalletLink();

      await expect(
        paktManager
          .connect(verifier)
          .linkWalletAndSourceId(user.address, "9876"),
      )
        .to.be.revertedWithCustomError(paktManager, "WalletAlreadyLinked")
        .withArgs(user.address);
    });

    it("doesn't allow to link a sourceId already linked", async () => {
      const {
        signers: { verifier, user2 },
        paktManager,
      } = await setupWalletLink();

      await expect(
        paktManager
          .connect(verifier)
          .linkWalletAndSourceId(user2.address, SOURCE_ID),
      )
        .to.be.revertedWithCustomError(paktManager, "SourceIdAlreadyLinked")
        .withArgs(SOURCE_ID);
    });

    it("doesn't allow to call function without verifier role", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupContracts();

      await expect(
        paktManager
          .connect(user)
          .linkWalletAndSourceId(user.address, SOURCE_ID),
      ).to.be.reverted;
    });
  });

  describe("makeNewPakt", () => {
    it("allows a user to create a pakt", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupWalletLink();

      await expect(paktManager.s_pakts(user.address, 0)).to.be.reverted;

      // approve
      await paktToken
        .connect(user)
        .approve(paktManager.address, parseEther("1000"));

      const balanceBefore = await paktToken.balanceOf(user.address);

      await expect(
        paktManager.connect(user).makeNewPakt(1, 1, parseEther("100"), ""),
      )
        .to.emit(paktManager, "PaktCreated")
        .withArgs(user.address, 0);

      const [pakt, isPaktTypeActive, balanceAfter] = await Promise.all([
        paktManager.s_pakts(user.address, 0),
        paktManager.s_activePaktTypes(user.address, 1),
        paktToken.balanceOf(user.address),
      ]);

      expect(pakt.amount).to.equal(parseEther("100"));
      expect(isPaktTypeActive).to.be.true;
      expect(balanceAfter).to.equal(balanceBefore.sub(pakt.amount));
    });

    it("doesn't allow to create a pakt with a wallet not linked", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupContracts();

      await expect(
        paktManager.connect(user).makeNewPakt(1, 1, parseEther("100"), ""),
      ).to.be.revertedWithCustomError(paktManager, "NoSourceIdLinked");
    });

    it("doesn't allow to create a pakt with an incorrect pakt type", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupWalletLink();

      const paktTypeCount = await paktManager.s_paktTypeCount();

      await expect(
        paktManager
          .connect(user)
          .makeNewPakt(paktTypeCount, 1, parseEther("100"), ""),
      )
        .to.be.revertedWithCustomError(paktManager, "UnhandledPaktType")
        .withArgs(paktTypeCount);
    });

    it("doesn't allow to create a pakt of same type as already active", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      await expect(
        paktManager.connect(user).makeNewPakt(1, 2, parseEther("100"), ""),
      )
        .to.be.revertedWithCustomError(
          paktManager,
          "UserAlreadyHasActivePaktOfType",
        )
        .withArgs(1);
    });

    it("doesn't allow to create a pakt with an incorrect level", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupWalletLink();

      await expect(
        paktManager.connect(user).makeNewPakt(1, 0, parseEther("100"), ""),
      )
        .to.be.revertedWithCustomError(paktManager, "LevelNotAllowed")
        .withArgs(1, 0);

      await expect(
        paktManager.connect(user).makeNewPakt(1, 6, parseEther("100"), ""),
      )
        .to.be.revertedWithCustomError(paktManager, "LevelNotAllowed")
        .withArgs(1, 6);
    });

    it("doesn't allow to create a pakt with an incorrect amount", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupWalletLink();

      const LEVEL = 2;

      const maxAmountForLevel = await paktManager.s_maxAmountByLevel(LEVEL);

      await expect(
        paktManager.connect(user).makeNewPakt(1, LEVEL, constants.Zero, ""),
      )
        .to.be.revertedWithCustomError(paktManager, "IncorrectAmount")
        .withArgs(LEVEL, constants.Zero);

      await expect(
        paktManager
          .connect(user)
          .makeNewPakt(1, LEVEL, parseEther(String(maxAmountForLevel + 1)), ""),
      )
        .to.be.revertedWithCustomError(paktManager, "IncorrectAmount")
        .withArgs(LEVEL, parseEther(String(maxAmountForLevel + 1)));
    });

    it("doesn't allow to create a pakt without enough token allowance", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupWalletLink();

      const AMOUNT = 100;

      // approve
      await paktToken
        .connect(user)
        .approve(paktManager.address, parseEther(String(AMOUNT - 1)));

      await expect(
        paktManager
          .connect(user)
          .makeNewPakt(1, 1, parseEther(String(AMOUNT)), ""),
      )
        .to.be.revertedWithCustomError(paktManager, "NotEnoughAllowance")
        .withArgs(parseEther(String(AMOUNT)));
    });

    it("allows to create another pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      await expect(paktManager.s_pakts(user.address, 1)).to.be.reverted;

      await paktManager.connect(user).makeNewPakt(2, 2, parseEther("101"), "");

      const paktAfter = await paktManager.s_pakts(user.address, 1);
      expect(paktAfter.amount).to.equal(parseEther("101"));
    });

    it("allows to create a custom pakt", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupWalletLink();

      // approve
      await paktToken
        .connect(user)
        .approve(paktManager.address, parseEther("1000"));

      const DESCRIPTION = "Custom pakt";

      await paktManager
        .connect(user)
        .makeNewPakt(0, 0, parseEther("200"), DESCRIPTION);

      const paktAfter = await paktManager.s_pakts(user.address, 0);
      expect(paktAfter.description).to.equal(DESCRIPTION);
    });
  });

  describe("extendPakt", () => {
    it("allows a user to extend a pakt", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupPakt();

      const PAKT_DURATION = await paktManager.PAKT_DURATION();

      // wait for one week
      await network.provider.send("evm_increaseTime", [PAKT_DURATION]);
      await network.provider.send("evm_mine");

      const [paktBefore, balanceBefore] = await Promise.all([
        paktManager.s_pakts(user.address, 0),
        paktToken.balanceOf(user.address),
      ]);

      const amountToAdd = parseEther("100");

      await expect(paktManager.connect(user).extendPakt(0, amountToAdd))
        .to.emit(paktManager, "PaktExtended")
        .withArgs(user.address, 0);

      const [paktAfter, balanceAfter] = await Promise.all([
        paktManager.s_pakts(user.address, 0),
        paktToken.balanceOf(user.address),
      ]);

      expect(paktAfter.amount).to.equal(paktBefore.amount.add(amountToAdd));
      expect(paktAfter.endTime).to.equal(paktBefore.endTime.add(PAKT_DURATION));
      expect(balanceAfter).to.equal(balanceBefore.sub(amountToAdd));
    });

    it("doesn't allow to extend an inactive pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPaktInactive();

      await expect(
        paktManager.connect(user).extendPakt(0, parseEther("100")),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeActive");
    });

    it("doesn't allow to extend an unfinished pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      await expect(
        paktManager.connect(user).extendPakt(0, parseEther("100")),
      ).to.be.revertedWithCustomError(paktManager, "PaktNotFinished");
    });

    it("doesn't allow to extend a pakt with an incorrect amount", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      const pakt = await paktManager.s_pakts(user.address, 0);

      const maxAmountForLevel = await paktManager.s_maxAmountByLevel(
        pakt.level,
      );

      await expect(paktManager.connect(user).extendPakt(0, constants.Zero))
        .to.be.revertedWithCustomError(paktManager, "IncorrectAmount")
        .withArgs(pakt.level, constants.Zero);

      await expect(
        paktManager
          .connect(user)
          .extendPakt(0, parseEther(String(maxAmountForLevel + 1))),
      )
        .to.be.revertedWithCustomError(paktManager, "IncorrectAmount")
        .withArgs(pakt.level, parseEther(String(maxAmountForLevel + 1)));
    });

    it("doesn't allow to extend a pakt without enough allowance", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      await expect(paktManager.connect(user).extendPakt(0, parseEther("300")))
        .to.be.revertedWithCustomError(paktManager, "NotEnoughAllowance")
        .withArgs(parseEther("300"));
    });
  });

  describe("markPaktVerified", () => {
    it("allows the verifier to mark a pakt as verified", async () => {
      const {
        signers: { user, verifier },
        paktManager,
      } = await setupPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      const paktBefore = await paktManager.s_pakts(user.address, 0);
      expect(paktBefore.success).to.be.false;

      await expect(
        paktManager.connect(verifier).markPaktVerified(user.address, 0),
      )
        .to.emit(paktManager, "PaktVerified")
        .withArgs(user.address, 0);

      const paktAfter = await paktManager.s_pakts(user.address, 0);
      expect(paktAfter.success).to.be.true;
    });

    it("doesn't allow to mark an inactive pakt as verified", async () => {
      const {
        signers: { user, verifier },
        paktManager,
      } = await setupPaktInactive();

      await expect(
        paktManager.connect(verifier).markPaktVerified(user.address, 0),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeActive");
    });

    it("doesn't allow to mark a custom pakt as verified", async () => {
      const {
        signers: { user, verifier },
        paktManager,
      } = await setupCustomPakt();

      await expect(
        paktManager.connect(verifier).markPaktVerified(user.address, 0),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustNotBeCustom");
    });

    it("doesn't allow to mark an unfinished pakt as verified", async () => {
      const {
        signers: { user, verifier },
        paktManager,
      } = await setupPakt();

      await expect(
        paktManager.connect(verifier).markPaktVerified(user.address, 0),
      ).to.be.revertedWithCustomError(paktManager, "PaktNotFinished");
    });

    it("doesn't allow an address without verifier role to mark a pakt as verified", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      await expect(paktManager.connect(user).markPaktVerified(user.address, 0))
        .to.be.reverted;
    });
  });

  describe("unlockFunds", () => {
    it("allows a user to unlock funds on a successful pakt", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupPaktVerified();

      const [balanceBefore, paktBefore, isPaktTypeActiveBefore] =
        await Promise.all([
          paktToken.balanceOf(user.address),
          paktManager.s_pakts(user.address, 0),
          paktManager.s_activePaktTypes(user.address, 1),
        ]);

      expect(isPaktTypeActiveBefore).to.be.true;

      const interests = await paktManager.computeInterestForAmount(
        paktBefore.amount,
        paktBefore.level,
      );

      await expect(
        paktManager
          .connect(user)
          .unlockFunds(0, { value: await paktManager.s_unlockFundsFee() }),
      )
        .to.emit(paktManager, "PaktEnded")
        .withArgs(user.address, 0);

      const [balanceAfter, paktAfter, isPaktTypeActiveAfter] =
        await Promise.all([
          paktToken.balanceOf(user.address),
          paktManager.s_pakts(user.address, 0),
          paktManager.s_activePaktTypes(user.address, 1),
        ]);

      expect(paktAfter.active).to.be.false;
      expect(isPaktTypeActiveAfter).to.be.false;
      expect(balanceAfter).to.equal(
        balanceBefore.add(paktAfter.amount).add(interests),
      );
    });

    it("doesn't allow to unlock without paying the fee", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPaktVerified();

      const fee = await paktManager.s_unlockFundsFee();

      await expect(
        paktManager
          .connect(user)
          .unlockFunds(0, { value: fee.sub(constants.One) }),
      ).to.be.revertedWithCustomError(paktManager, "NeedToPayFee");
    });

    it("doesn't allow to unlock an inactive pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPaktInactive();

      await expect(
        paktManager
          .connect(user)
          .unlockFunds(0, { value: await paktManager.s_unlockFundsFee() }),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeActive");
    });

    it("doesn't allow to unlock an unverified pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      await expect(
        paktManager
          .connect(user)
          .unlockFunds(0, { value: await paktManager.s_unlockFundsFee() }),
      ).to.be.revertedWithCustomError(paktManager, "GoalNotReached");
    });
  });

  describe("failPakt", () => {
    it("allows a user to archive a pakt", async () => {
      const {
        signers: { user },
        paktManager,
        paktToken,
      } = await setupPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      const [
        userBalanceBefore,
        supplyBefore,
        paktBefore,
        isPaktTypeActiveBefore,
      ] = await Promise.all([
        paktToken.balanceOf(user.address),
        paktToken.totalSupply(),
        paktManager.s_pakts(user.address, 0),
        paktManager.s_activePaktTypes(user.address, 1),
      ]);

      expect(isPaktTypeActiveBefore).to.be.true;

      const interests = await paktManager.computeInterestForAmount(
        paktBefore.amount,
        paktBefore.level,
      );
      const burnRatio = await paktManager.s_burnInterestRatio();
      const burnAmount = interests.mul(burnRatio);

      await expect(paktManager.connect(user).failPakt(0))
        .to.emit(paktManager, "PaktEnded")
        .withArgs(user.address, 0);

      const [userBalanceAfter, supplyAfter, paktAfter, isPaktTypeActiveAfter] =
        await Promise.all([
          paktToken.balanceOf(user.address),
          paktToken.totalSupply(),
          paktManager.s_pakts(user.address, 0),
          paktManager.s_activePaktTypes(user.address, 1),
        ]);

      expect(paktAfter.active).to.be.false;
      expect(isPaktTypeActiveAfter).to.be.false;
      expect(userBalanceAfter).to.equal(
        userBalanceBefore.add(paktAfter.amount).sub(burnAmount),
      );
      expect(supplyAfter).to.equal(supplyBefore.sub(burnAmount));
    });

    it("doesn't allow to archive an inactive pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPaktInactive();

      await expect(
        paktManager.connect(user).failPakt(0),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeActive");
    });

    it("doesn't allow to archive a custom pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupCustomPakt();

      await expect(
        paktManager.connect(user).failPakt(0),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustNotBeCustom");
    });

    it("doesn't allow to archive an unfinished pakt", async () => {
      const {
        signers: { user },
        paktManager,
      } = await setupPakt();

      await expect(
        paktManager.connect(user).failPakt(0),
      ).to.be.revertedWithCustomError(paktManager, "PaktNotFinished");
    });
  });

  describe("endCustomPakt", () => {
    it("allows a user to recover funds after custom pakt", async () => {
      const {
        paktManager,
        paktToken,
        signers: { user },
      } = await setupCustomPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      const [userBalanceBefore, contractBalanceBefore] = await Promise.all([
        paktToken.balanceOf(user.address),
        paktToken.balanceOf(paktManager.address),
      ]);

      await expect(paktManager.connect(user).endCustomPakt(0, true))
        .to.emit(paktManager, "PaktEnded")
        .withArgs(user.address, 0);

      const [pakt, userBalanceAfter, contractBalanceAfter] = await Promise.all([
        paktManager.s_pakts(user.address, 0),
        paktToken.balanceOf(user.address),
        paktToken.balanceOf(paktManager.address),
      ]);

      expect(pakt.active).to.be.false;
      expect(userBalanceAfter).to.equal(userBalanceBefore.add(pakt.amount));
      expect(contractBalanceAfter).to.equal(
        contractBalanceBefore.sub(pakt.amount),
      );
    });

    it("allows to archive a custom pakt", async () => {
      const {
        paktManager,
        paktToken,
        signers: { user },
      } = await setupCustomPakt();

      // wait for one week
      await network.provider.send("evm_increaseTime", [
        await paktManager.PAKT_DURATION(),
      ]);
      await network.provider.send("evm_mine");

      const [balanceBefore, supplyBefore] = await Promise.all([
        paktToken.balanceOf(user.address),
        paktToken.totalSupply(),
      ]);

      await expect(paktManager.connect(user).endCustomPakt(0, false))
        .to.emit(paktManager, "PaktEnded")
        .withArgs(user.address, 0);

      const [pakt, balanceAfter, supplyAfter] = await Promise.all([
        paktManager.s_pakts(user.address, 0),
        paktToken.balanceOf(user.address),
        paktToken.totalSupply(),
      ]);

      expect(pakt.active).to.be.false;
      expect(balanceAfter).to.equal(balanceBefore);
      expect(supplyAfter).to.equal(supplyBefore.sub(pakt.amount));
    });

    it("doesn't allow to end an inactive pakt", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupPaktInactive();

      await expect(
        paktManager.connect(user).endCustomPakt(0, true),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeActive");
    });

    it("doesn't allow to en a non custom pakt", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupPakt();

      await expect(
        paktManager.connect(user).endCustomPakt(0, true),
      ).to.be.revertedWithCustomError(paktManager, "PaktMustBeCustom");
    });

    it("doesn't allow to end an unfinished pakt", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupCustomPakt();

      await expect(
        paktManager.connect(user).endCustomPakt(0, true),
      ).to.be.revertedWithCustomError(paktManager, "PaktNotFinished");
    });
  });

  describe("withdraw", () => {
    it("allows an admin to withdraw the balance", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupPaktUnlocked();

      if (!owner.provider) return new Error("No provider");
      const { provider } = owner;

      const [contractBalanceBefore, adminBalanceBefore] = await Promise.all([
        provider.getBalance(paktManager.address),
        provider.getBalance(owner.address),
      ]);

      expect(contractBalanceBefore).to.be.greaterThan(constants.Zero);

      const transaction = await paktManager.connect(owner).withdraw();

      const [contractBalanceAfter, adminBalanceAfter, receipt] =
        await Promise.all([
          provider.getBalance(paktManager.address),
          provider.getBalance(owner.address),
          provider.getTransactionReceipt(transaction.hash),
        ]);
      const gasCost = receipt.effectiveGasPrice.mul(receipt.gasUsed);

      expect(contractBalanceAfter).to.equal(constants.Zero);
      expect(adminBalanceAfter).to.equal(
        adminBalanceBefore.add(contractBalanceBefore).sub(gasCost),
      );
    });

    it("doesn't allow an address without admin role to withdraw", async () => {
      const {
        paktManager,
        signers: { owner, user },
      } = await setupPaktUnlocked();

      if (!owner.provider) return new Error("No provider");
      const { provider } = owner;

      const contractBalanceBefore = await provider.getBalance(
        paktManager.address,
      );

      expect(contractBalanceBefore).to.be.greaterThan(constants.Zero);

      await expect(paktManager.connect(user).withdraw()).to.be.reverted;
    });

    it("should revert if caller cannot receive transfer", async () => {
      const { paktManager } = await setupContracts();

      const factory = await ethers.getContractFactory("WithdrawContractTest");
      const withdrawContractTest = (await factory.deploy(
        paktManager.address,
      )) as WithdrawContractTest;

      await paktManager.grantRole(
        await paktManager.DEFAULT_ADMIN_ROLE(),
        withdrawContractTest.address,
      );

      await expect(withdrawContractTest.withdrawFromPaktManager())
        .to.be.revertedWithCustomError(paktManager, "FailedTransfer")
        .withArgs(constants.Zero);
    });
  });

  describe("setPaktTypeCount", () => {
    it("allows an admin to change paktTypeCount", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupContracts();

      const paktTypeCountBefore = await paktManager.s_paktTypeCount();

      await paktManager.connect(owner).setPaktTypeCount(10);

      const paktTypeCountAfter = await paktManager.s_paktTypeCount();

      expect(paktTypeCountAfter).not.to.equal(paktTypeCountBefore);
      expect(paktTypeCountAfter).to.equal(10);
    });

    it("doesn't allow a non admin to change paktTypeCount", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupContracts();

      await expect(paktManager.connect(user).setPaktTypeCount(10)).to.be
        .reverted;
    });
  });

  describe("setMaxAmountByLevel", () => {
    it("allows an admin to change maxAmountByLevel", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupContracts();

      const maxAmountBefore = await paktManager.s_maxAmountByLevel(2);

      await paktManager
        .connect(owner)
        .setMaxAmountByLevel([0, 1000, 2000, 3000, 4000, 5000]);

      const maxAmountAfter = await paktManager.s_maxAmountByLevel(2);

      expect(maxAmountAfter).not.to.equal(maxAmountBefore);
      expect(maxAmountAfter).to.equal(2000);
    });

    it("doesn't allow a non admin to change maxAmountByLevel", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupContracts();

      await expect(
        paktManager
          .connect(user)
          .setMaxAmountByLevel([0, 1000, 2000, 3000, 4000, 5000]),
      ).to.be.reverted;
    });
  });

  describe("setInterestRateByLevel", () => {
    it("allows an admin to change interestRateByLevel", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupContracts();

      const interestRateBefore = await paktManager.s_interestRateByLevel(5);

      await paktManager
        .connect(owner)
        .setInterestRateByLevel([0, 10, 11, 12, 13, 14]);

      const interestRateAfter = await paktManager.s_interestRateByLevel(5);

      expect(interestRateAfter).not.to.equal(interestRateBefore);
      expect(interestRateAfter).to.equal(14);
    });

    it("doesn't allow a non admin to change interestRateByLevel", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupContracts();

      await expect(
        paktManager
          .connect(user)
          .setInterestRateByLevel([0, 10, 11, 12, 13, 14]),
      ).to.be.reverted;
    });
  });

  describe("setBurnInterestRatio", () => {
    it("allows an admin to change burnInterestRatio", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupContracts();

      const burnRatioBefore = await paktManager.s_burnInterestRatio();

      await paktManager.connect(owner).setBurnInterestRatio(10);

      const burnRatioAfter = await paktManager.s_burnInterestRatio();

      expect(burnRatioAfter).not.to.equal(burnRatioBefore);
      expect(burnRatioAfter).to.equal(10);
    });

    it("doesn't allow a non admin to change burnInterestRatio", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupContracts();

      await expect(paktManager.connect(user).setBurnInterestRatio(10)).to.be
        .reverted;
    });
  });

  describe("setUnlockFundsFee", () => {
    it("allows an admin to change unlockFundsFee", async () => {
      const {
        paktManager,
        signers: { owner },
      } = await setupContracts();

      const unlockFeeBefore = await paktManager.s_unlockFundsFee();

      await paktManager.connect(owner).setUnlockFundsFee(parseEther("0.2"));

      const unlockFeeAfter = await paktManager.s_unlockFundsFee();

      expect(unlockFeeAfter).not.to.equal(unlockFeeBefore);
      expect(unlockFeeAfter).to.equal(parseEther("0.2"));
    });

    it("doesn't allow a non admin to change unlockFundsFee", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupContracts();

      await expect(
        paktManager.connect(user).setUnlockFundsFee(parseEther("0.2")),
      ).to.be.reverted;
    });
  });

  describe("getMaxAmountByLevel", () => {
    it("allows to get data", async () => {
      const { paktManager } = await setupContracts();

      const data = await paktManager.getMaxAmountByLevel();

      expect(data).to.eql([0, 100, 200, 300, 400, 500]);
    });
  });

  describe("getInterestRateByLevel", () => {
    it("allows to get data", async () => {
      const { paktManager } = await setupContracts();

      const data = await paktManager.getInterestRateByLevel();

      expect(data).to.eql([0, 8, 9, 10, 11, 12]);
    });
  });

  describe("getAllPaktsFromUser", () => {
    it("allows to get data", async () => {
      const {
        paktManager,
        signers: { user },
      } = await setupPakt();

      const pakts = await paktManager.getAllPaktsFromUser(user.address);

      expect(pakts[0].amount).to.equal(parseEther("100"));
    });
  });
});
