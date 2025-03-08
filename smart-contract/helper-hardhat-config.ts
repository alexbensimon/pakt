interface NetworkConfig {
  [chainId: number]: {
    name: string;
    paktVerifier: string;
  };
}

export const networkConfig: NetworkConfig = {
  1337: {
    name: "hardhat",
    paktVerifier: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  80001: {
    name: "mumbai",
    paktVerifier: "0x04818d146c93565ba4BD132491e5A1B3148612dF",
  },
  137: {
    name: "polygon",
    paktVerifier: "0x678A9781257E39013Da1605619B5BA81e117247F",
  },
};
