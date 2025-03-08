import axios from "axios";
import "dotenv/config";
import { BigNumber, ethers } from "ethers";
import { Request, Response } from "express";
import { google } from "googleapis";
import contractInfo from "../contracts/contract-info.json";
import {
  dataTypeNameByPaktType,
  getManualInputDataSourceIdByPaktType,
  getPaktTypeByIndex,
  goalByPaktTypeAndLevel,
  PaktType,
  RequestAction,
} from "./utils";

export const paktVerifier = async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");

  let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  // No gas station for local chain
  if (contractInfo.chainId !== "1337") {
    try {
      const { data } = await axios({
        method: "get",
        url:
          contractInfo.chainId === "137"
            ? "https://gasstation-mainnet.matic.network/v2"
            : "https://gasstation-mumbai.matic.today/v2",
      });
      maxFeePerGas = ethers.utils.parseUnits(
        String(Math.ceil(data.fast.maxFee)),
        "gwei",
      );
      maxPriorityFeePerGas = ethers.utils.parseUnits(
        String(Math.ceil(data.fast.maxPriorityFee)),
        "gwei",
      );
    } catch (error) {
      console.error(error);
    }
  }

  const { authCode } = JSON.parse(req.body);
  console.log(
    "🚀 ~ file: index.ts ~ line 22 ~ paktVerifier ~ authCode",
    authCode,
  );

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
  );
  const tokenResponse = await oauth2Client.getToken(authCode);
  oauth2Client.setCredentials(tokenResponse.tokens);
  const info = await oauth2Client.getTokenInfo(
    tokenResponse.tokens.access_token || "",
  );
  const sourceId = BigNumber.from(info.sub);
  console.log(
    "🚀 ~ file: index.ts ~ line 56 ~ paktVerifier ~ sourceId",
    sourceId.toString(),
  );
  if (!sourceId) return res.status(403);

  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  const contract = new ethers.Contract(
    contractInfo.contracts.PaktManager.address,
    contractInfo.contracts.PaktManager.abi,
    wallet,
  );

  const { action } = JSON.parse(req.body);
  console.log("🚀 ~ file: index.ts ~ line 19 ~ paktVerifier ~ action", action);

  // LINK_SOURCE_ID
  if (action === RequestAction.LINK_SOURCE_ID) {
    const { paktOwner } = JSON.parse(req.body);
    console.log(
      "🚀 ~ file: index.ts ~ line 43 ~ paktVerifier ~ paktOwner",
      paktOwner,
    );
    const walletSourceId: BigNumber = await contract.s_walletToSourceId(
      paktOwner,
    );
    if (walletSourceId.toString() !== "0")
      return res
        .status(403)
        .send("This wallet has already been linked to a Google account.");

    const sourceIdWallet: string = await contract.s_sourceIdToWallet(sourceId);
    if (sourceIdWallet !== ethers.constants.AddressZero)
      return res
        .status(403)
        .send("This Google account has already been linked to another wallet.");

    try {
      await contract.linkWalletAndSourceId(paktOwner, sourceId, {
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    } catch (error) {
      console.error(error);
    }
  }

  // VERIFY_PAKT
  else if (action === RequestAction.VERIFY_PAKT) {
    const { paktOwner, paktIndex } = JSON.parse(req.body);
    console.log(
      "🚀 ~ file: index.ts ~ line 19 ~ paktVerifier ~ paktOwner",
      paktOwner,
    );
    console.log(
      "🚀 ~ file: index.ts ~ line 19 ~ paktVerifier ~ paktIndex",
      paktIndex,
    );

    // VERIFY SOURCE_ID

    const paktOwnerSourceId = await contract.s_walletToSourceId(paktOwner);
    if (!sourceId.eq(paktOwnerSourceId)) {
      return res
        .status(403)
        .send(
          "The Google account used is not the one linked to the user wallet.",
        );
    }

    // GET PAKT TO VERIFY

    const pakt = await contract.s_pakts(paktOwner, paktIndex);
    if (!pakt) return res.status(403);

    const paktType = getPaktTypeByIndex(pakt.paktType);
    const startTimeMillis = Number(pakt.startTime) * 1000;
    const endTimeMillis = Number(pakt.endTime) * 1000;

    if (
      !pakt.active ||
      paktType == PaktType.CUSTOM ||
      endTimeMillis > Date.now()
    )
      return res.status(403);

    const fitness = google.fitness({ version: "v1", auth: oauth2Client });

    // COMPUTE RESULT

    const withManualInput = await fitness.users.dataset.aggregate({
      // @ts-expect-error wrong lib typing
      userId: "me",

      // Request body metadata
      requestBody: {
        aggregateBy: [
          {
            dataSourceId: getManualInputDataSourceIdByPaktType(paktType),
          },
        ],
        startTimeMillis,
        endTimeMillis,
      },
    });
    const hasManualInputSteps = !!(withManualInput as any).data.bucket?.[0]
      ?.dataset?.[0]?.point?.length;
    if (hasManualInputSteps) {
      const message = "Remove manual input to be able to use Pakt.";
      console.error(message);
      res.status(403);
      return res.send(message);
    }

    const oneDayTime = 86400000;
    const fitRes = await fitness.users.dataset.aggregate({
      // @ts-expect-error wrong lib typing
      userId: "me",

      // Request body metadata
      requestBody: {
        aggregateBy: [
          {
            dataTypeName: dataTypeNameByPaktType[paktType],
          },
        ],
        bucketByTime: { durationMillis: oneDayTime },
        startTimeMillis,
        endTimeMillis,
      },
    });

    let values: number[];
    if (paktType === PaktType.MEDITATION) {
      values = (fitRes as any).data.bucket.reduce(
        (acc: number[], current: any) => {
          // 45 is the id for meditation
          const point = current.dataset[0].point.find(
            (point: any) => point.value[0].intVal === 45,
          );
          // The value is in ms so to get the time in minutes we need to divide by 60 * 1000
          const value = point ? point.value[1].intVal / (60 * 1000) : 0;
          return [...acc, value];
        },
        [],
      );
    } else {
      values = (fitRes as any).data.bucket.map(
        (bucket: any) => bucket.dataset[0].point[0]?.value[0]?.intVal || 0,
      );
    }

    let result = 0;

    if (values.length) {
      result = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    console.log("🚀 ~ file: index.ts ~ line 179 ~ result", result);

    const isPaktSuccess =
      result >= goalByPaktTypeAndLevel[paktType][pakt.level];

    if (!isPaktSuccess) return res.status(403);

    // CALL CONTRACT TO MARK AS VERIFY

    await contract.markPaktVerified(paktOwner, paktIndex, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  } else {
    return res.status(403);
  }

  res.statusCode = 200;
  res.send("OK");
};
