import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_COUNTER_PACKAGE_ID,
  TESTNET_COUNTER_PACKAGE_ID,
  MAINNET_COUNTER_PACKAGE_ID,
  TESTNET_JOURNAL_PACKAGE_ID,

  DEVNET_JOURNAL_PACKAGE_ID,
  MAINNET_JOURNAL_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
        journalPackageId: DEVNET_JOURNAL_PACKAGE_ID,
        graphqlUrl: "https://graphql.devnet.sui.io/graphql",
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        counterPackageId: TESTNET_COUNTER_PACKAGE_ID,
         journalPackageId: TESTNET_JOURNAL_PACKAGE_ID,
         graphqlUrl: "https://graphql.testnet.sui.io/graphql",
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        counterPackageId: MAINNET_COUNTER_PACKAGE_ID,
        journalPackageId: MAINNET_JOURNAL_PACKAGE_ID,
        graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
