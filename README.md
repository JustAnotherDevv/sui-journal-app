# Sui Journal App Workshop

deployed packageID: `0x712cb3641813e9ef2fa735af51b4b119d0df509028ff25816b5f788a1bb2e009`


Learn Sui blockchain development by building a decentralized journal application. This hands-on workshop starts with deploying a simple counter contract to practice the fundamentals, then guides you through building a complete journal dApp with progressive feature additions.

## Workshop Overview

**What You'll Build:**
- Phase 1: Deploy and test a counter smart contract (practice deployment workflow)
- Phase 2: Build a journal dApp with create, read, and global discovery features

**What You'll Learn:**
- Deploying Move smart contracts to Sui testnet
- Working with shared and owned objects
- Building transactions and calling Move functions
- Querying blockchain data with RPC and GraphQL
- Integrating Sui wallet functionality in React apps

## Prerequisites

Before starting this workshop, make sure you have:

- **Sui CLI installed and configured** - Follow the [Sui Getting Started Guide](https://docs.sui.io/guides/developer/getting-started)
- **Node.js and pnpm** - For running the React application
- **Basic TypeScript/React knowledge** - Familiarity with React components and hooks
- **A code editor** - VS Code or your preferred editor

**Need help with installation?** Join our [Discord community](https://discord.gg/K79FVNcw55) for support!

### Verify Your Setup

Before proceeding, verify that all required tools are installed:

```bash
# Check Sui CLI is installed
sui --version
# Should output something like: sui 1.58.x

# Check Node.js is installed (v18+ recommended)
node --version
# Should output something like: v18.x.x or higher

# Check pnpm is installed
pnpm --version
# Should output something like: 8.x.x or 9.x.x
```

If any of these commands fail, please install the missing tools before continuing.

## Getting Started

Fork this repository and clone it to your local machine.

**Questions or stuck?** Join our [Discord community](https://discord.gg/K79FVNcw55) for help!

## Step 0: Counter Example

**Goal:** Deploy and test the counter smart contract to understand basic Sui deployment workflow and dApp interaction patterns.

This repository includes a working counter contract in the `move/counter/` directory. You'll deploy this contract, connect it to the frontend, and test the complete application.

### 1. Set Up Sui Testnet Environment

If you haven't already, configure your Sui CLI for testnet:

```bash
# Add testnet environment
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet

# Create a new wallet address (if you don't have one)
sui client new-address secp256k1

# Switch to your address
sui client switch --address YOUR_ADDRESS
```

### 2. Deploy the Counter Contract

Navigate to the Move package and publish it to testnet:

```bash
cd move/counter
sui client publish --gas-budget 100000000
```

**Important:** Save the `packageId` from the publish output - you'll need it in the next step.

Example output:
```
Created Object:
  PackageID: 0x123abc...
```

### 3. Update Frontend Configuration

Open [src/constants.ts](src/constants.ts) and update the counter package ID:

```ts
export const TESTNET_COUNTER_PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
```

### 4. Test the Counter App

Install dependencies and start the development server:

```bash
# Return to project root
cd ../..

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open your browser to the local development URL (typically `http://localhost:5173`).

**Testing Features:**

1. **Connect Wallet** - Click "Connect Wallet" in the top right
   - **No browser extension needed!** The app includes Slush web wallet - just sign in with Google

2. **Get Testnet SUI** - Once connected, click the "Get Testnet SUI" button
   - Opens the Sui faucet with your address pre-filled
   - Request testnet tokens for gas fees

3. **Create Counter** - Click to create a new shared counter object

4. **Increment Counter** - Test incrementing the counter value

5. **Explore Code (Optional)** - Review [src/Counter.tsx](src/Counter.tsx) and [src/CreateCounter.tsx](src/CreateCounter.tsx) to see how:
   - Transactions are built with `@mysten/sui/transactions`
   - Move functions are called from the frontend
   - Shared objects are queried and updated

**Key Concepts Learned:**
- Deploying Move contracts to Sui testnet
- Shared objects (accessible by anyone)
- Building and executing transactions
- Querying on-chain data
- Connecting wallets to dApps

---

## Building the Journal App

Now that you've practiced deploying contracts and interacting with shared objects through the counter example, you're ready to build the journal application. The journal will use **owned objects** (instead of shared objects) where each user controls their own journal, making it more private and gas-efficient for personal data.

---

## Step 1: Create Journal Smart Contract

**Goal:** Write and deploy a Move contract that creates journals and stores entries.

### Create Journal Package

First, create a new Move package for the journal smart contract:

```bash
cd move
sui move new journal
```

This command creates a new directory structure:
```
move/journal/
├── Move.toml          # Package manifest (dependencies, addresses)
└── sources/           # Your Move source code goes here
    └── (empty)
```

The `Move.toml` file is pre-configured with Sui framework dependencies. Now you'll add the journal smart contract code.

### Write Journal Contract

Create a new file [move/journal/sources/journal.move](move/journal/sources/journal.move) with the following structs and functions:

#### Structs

**Journal** - An owned Sui object representing a journal
- Abilities: key, store
- Fields:
  - `id: UID`
  - `owner: address`
  - `title: String`
  - `entries: vector<Entry>`

**Entry** - A struct representing a journal entry, to be stored in the `Journal` object. 
- Abilities: store
- Fields:
  - `content: String`
  - `create_at_ms: u64`

#### Functions

**new_journal**
- Parameters: `title: String`, `ctx: &mut TxContext`
- Returns: `Journal`
- Creates and returns a new Journal object with an empty entries vector

**add_entry**
- Parameters: `journal: &mut Journal`, `content: String`, `clock: &Clock`, `ctx: &TxContext`
- Returns: nothing
- Verifies the caller is the journal owner
- Creates a new Entry with the content and current timestamp from the clock
- Adds the entry to the journal's entries vector

**Hints:**
- You'll need to import `std::string::String` and `sui::clock::Clock`
- Use `clock.timestamp_ms()` to get the current timestamp

### Deploy Journal Contract

```bash
sui client publish --gas-budget 100000000 journal
```

### Update Constants

Update [src/constants.ts](src/constants.ts):

```ts
export const TESTNET_JOURNAL_PACKAGE_ID = "0xYOUR_JOURNAL_PACKAGE_ID";
```

### Update Network Config

Update [src/networkConfig.ts](src/networkConfig.ts) to add `journalPackageId` to the testnet configuration:

```ts
testnet: {
  url: getFullnodeUrl("testnet"),
  variables: {
    journalPackageId: TESTNET_JOURNAL_PACKAGE_ID,
  },
},
```

### Test

Try calling your `new_journal` function from the Sui CLI:

```bash
sui client call --package <PACKAGE_ID> --module journal --function new_journal --args "My First Journal" --gas-budget 10000000
```

**Key concepts:** Owned objects, vector storage, Clock object.

---

## Step 2: Create and View Journals

**Goal:** Build UI to create journals and add entries.

### Create CreateJournal Component

Create [src/CreateJournal.tsx](src/CreateJournal.tsx):

```tsx
import { Transaction } from "@mysten/sui/transactions";
import { Button, Container, TextField } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";

export function CreateJournal({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const journalPackageId = useNetworkVariable("journalPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [title, setTitle] = useState("");
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  function create() {
    if (!currentAccount) return;

    /**
     * Task 1:
     *
     * Create a new Transaction instance from the @mysten/sui/transactions module.
     */

    /**
     * Task 2: 
     * 
     * Execute a call to the `journal::new_journal` function to create a new journal. 
     * 
     * Make sure to use the title input from the user
     */

    /**
     * Task 3: 
     * 
     * Transfer the new Journal object to the connected user's address
     * 
     * Hint: use currentAccount.address to the user's address
     */

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await suiClient.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });

          onCreated(effects?.created?.[0]?.reference?.objectId!);
        },
      },
    );
  }

  return (
    <Container>
      <TextField.Root
        placeholder="Enter journal title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="3"
        mb="3"
      />
      <Button
        size="3"
        onClick={() => {
          create();
        }}
        disabled={isSuccess || isPending || !title.trim()}
      >
        {isSuccess || isPending ? <ClipLoader size={20} /> : "Create Journal"}
      </Button>
    </Container>
  );
}
```

### Create Journal Viewing Component

Create [src/Journal.tsx](src/Journal.tsx):

```tsx
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { SuiObjectData } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Flex, Heading, Text, TextArea, Box } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function Journal({ id, onBack }: { id: string; onBack: () => void }) {
  const journalPackageId = useNetworkVariable("journalPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  /**
   * Task:
   *
   * Use useSuiClientQuery to fetch the Journal object by its ID.
   *
   * You'll need to:
   * - Query "getObject"
   * - Pass the journal id
   * - Request showContent: true and showOwner: true in options
   *
   * This will allow us to display the journal's title, entries, and verify ownership.
   */
  const { data, isPending, error, refetch } = { data: null, isPending: false, error: null, refetch: () => {} } as any;

  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState("");

  const addEntry = () => {
    if (!newEntryContent.trim()) return;
    setWaitingForTxn(true);

    /**
     * Task 1:
     *
     * Create a new Transaction instance from the @mysten/sui/transactions module.
     */

    /**
     * Task 2:
     *
     * Execute a call to the `journal::add_entry` function to add a new entry to the journal.
     *
     * You'll need to pass three arguments:
     * - The journal object (use tx.object(id))
     * - The entry content string (use tx.pure.string(newEntryContent))
     * - The Clock object (use tx.object.clock())
     */

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (tx) => {
          suiClient.waitForTransaction({ digest: tx.digest }).then(async () => {
            await refetch();
            setWaitingForTxn(false);
            setNewEntryContent("");
          });
        },
        onError: () => {
          setWaitingForTxn(false);
        },
      },
    );
  };

  if (isPending) return <Text>Loading...</Text>;

  if (error) return <Text>Error: {error.message}</Text>;

  if (!data.data) return <Text>Not found</Text>;

  const journalFields = getJournalFields(data.data);
  const ownedByCurrentAccount = journalFields?.owner === currentAccount?.address;

  return (
    <>
      <Flex justify="between" align="center" mb="3">
        <Heading size="3">{journalFields?.title || "Journal"}</Heading>
        <Button variant="soft" onClick={onBack}>
          Back to Journals
        </Button>
      </Flex>

      <Flex direction="column" gap="4" mt="4">
        {/* Past Entries */}
        <Box>
          <Heading size="2" mb="2">
            Past Entries
          </Heading>
          {journalFields?.entries && journalFields.entries.length > 0 ? (
            <Flex direction="column" gap="3">
              {journalFields.entries.map((entry: any, index: number) => (
                <Box
                  key={index}
                  p="3"
                  style={{
                    background: "var(--gray-a3)",
                    borderRadius: "var(--radius-2)",
                  }}
                >
                  <Text size="1" color="gray" mb="1">
                    {formatTimestamp(entry.create_at_ms)}
                  </Text>
                  <Text m="1">{entry.content}</Text>
                </Box>
              ))}
            </Flex>
          ) : (
            <Text color="gray">No entries yet</Text>
          )}
        </Box>

        {/* Add New Entry */}
        {ownedByCurrentAccount && (
          <Box>
            <Heading size="2" mb="2">
              Add New Entry
            </Heading>
            <Flex direction="column" gap="2">
              <TextArea
                placeholder="Write your journal entry here..."
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                disabled={waitingForTxn}
                rows={4}
              />
              <Button
                onClick={addEntry}
                disabled={waitingForTxn || !newEntryContent.trim()}
              >
                {waitingForTxn ? <ClipLoader size={20} /> : "Add Entry"}
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </>
  );
}

function getJournalFields(data: SuiObjectData) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }

  const fields = data.content.fields as {
    owner: string;
    title: string;
    entries: Array<{ fields: { content: string; create_at_ms: string } }>;
  };

  return {
    owner: fields.owner,
    title: fields.title,
    entries: fields.entries.map((entry) => entry.fields),
  };
}

function formatTimestamp(timestampMs: string): string {
  const date = new Date(parseInt(timestampMs));
  return date.toLocaleString();
}
```

### Update App Component

Update [src/App.tsx](src/App.tsx):

```tsx
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import { Journal } from "./Journal";
import { CreateJournal } from "./CreateJournal";

function App() {
  const currentAccount = useCurrentAccount();
  const [journalId, setJournal] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Journal App</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ? (
            journalId ? (
              <Journal
                id={journalId}
                onBack={() => {
                  window.location.hash = "";
                  setJournal(null);
                }}
              />
            ) : (
              <CreateJournal
                onCreated={(id) => {
                  window.location.hash = id;
                  setJournal(id);
                }}
              />
            )
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
```

### Test

```bash
pnpm dev
```

Create a journal, add entries, and verify they persist on-chain.

**Key concepts:** Transaction building, object transfer, RPC queries.

---

## Step 3: List Your Journals

**Goal:** Display all journals owned by the connected wallet.

### Create JournalList Component

Create [src/JournalList.tsx](src/JournalList.tsx):

```tsx
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

export function JournalList({
  onSelectJournal,
}: {
  onSelectJournal: (id: string) => void;
}) {
  const currentAccount = useCurrentAccount();
  const journalPackageId = useNetworkVariable("journalPackageId");

  /**
   * Task:
   *
   * Use useSuiClientQuery to fetch all Journal objects owned by the current user.
   *
   * You'll need to:
   * - Query "getOwnedObjects"
   * - Filter by StructType: `${journalPackageId}::journal::Journal`
   * - Request showContent: true and showType: true in options
   * - Only enable the query when currentAccount?.address exists
   *
   * Hint: Look at the useSuiClientQuery documentation for the correct format
   */
  const { data, isPending, error } = { data: null, isPending: false, error: null } as any;

  if (isPending) {
    return (
      <Flex justify="center" align="center" p="6">
        <ClipLoader size={40} />
      </Flex>
    );
  }

  if (error) {
    return <Text color="red">Error loading journals: {error.message}</Text>;
  }

  const journals = data?.data || [];

  return (
    <Box>
      <Heading size="5" mb="4">
        My Journals
      </Heading>

      {journals.length === 0 ? (
        <Card>
          <Text color="gray">
            You don't have any journals yet. Create your first journal to get
            started!
          </Text>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          {journals.map((journal) => {
            const content = journal.data?.content;
            const fields =
              content?.dataType === "moveObject"
                ? (content.fields as { title: string; owner: string })
                : null;

            return (
              <Card
                key={journal.data?.objectId}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectJournal(journal.data?.objectId!)}
              >
                <Heading size="3">{fields?.title || "Untitled Journal"}</Heading>
                <Text size="1" color="gray" mt="1">
                  ID: {journal.data?.objectId}
                </Text>
              </Card>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
```

### Update App Component

Update [src/App.tsx](src/App.tsx) to import and render JournalList:

```tsx
import { JournalList } from "./JournalList";

// Inside the return statement, where CreateJournal is rendered:
<Flex direction="column" gap="6">
  <CreateJournal
    onCreated={(id) => {
      window.location.hash = id;
      setJournal(id);
    }}
  />
  <JournalList
    onSelectJournal={(id) => {
      window.location.hash = id;
      setJournal(id);
    }}
  />
</Flex>
```

### Test

```bash
pnpm dev
```

Create multiple journals and verify they appear in your journal list. Click on a journal to view its entries.

**Key concepts:** Filtering owned objects by type, RPC queries.

---

## Step 4: Global Journal Gallery

**Goal:** Query and display all journals on the network using GraphQL.

### Update Network Config

First, update [src/networkConfig.ts](src/networkConfig.ts) to add `graphqlUrl` to the testnet configuration:

```ts
testnet: {
  url: getFullnodeUrl("testnet"),
  variables: {
    journalPackageId: TESTNET_JOURNAL_PACKAGE_ID,
    graphqlUrl: "https://graphql.testnet.sui.io/graphql",
  },
},
```

### Explore GraphQL API

Before building the component, let's explore Sui's GraphQL API to understand how to query objects globally.

Open the [Sui GraphQL IDE](https://graphql.testnet.sui.io/graphql) and try this query (replace the package ID with your own):

```graphql
{
  objects(
    filter: {type: "0xYOUR_PACKAGE_ID::journal::Journal"}
  ) {
    pageInfo {
      hasNextPage
      startCursor
      endCursor
    }
    nodes {
      address
      asMoveObject {
        contents {
          json
        }
      }
    }
  }
}
```

This query fetches all Journal objects on the network, not just ones you own. Notice how the `pageInfo` fields will help us implement pagination.

### Create Gallery Component

Create [src/JournalGallery.tsx](src/JournalGallery.tsx):

```tsx
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";
import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

type JournalNode = {
  address: string;
  asMoveObject?: {
    contents?: {
      json?: {
        title?: string;
        owner?: string;
      };
    };
  };
};

export function JournalGallery({
  onSelectJournal,
}: {
  onSelectJournal: (id: string) => void;
}) {
  const graphqlUrl = useNetworkVariable("graphqlUrl");
  const journalPackageId = useNetworkVariable("journalPackageId");

  const [journals, setJournals] = useState<JournalNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchJournals = async (cursor?: string | null) => {
    try {
      const client = new SuiGraphQLClient({ url: graphqlUrl });

      /**
       * This is the same query you explored in the GraphQL IDE, but parameterized:
       * - $type allows us to pass the package ID dynamically
       * - $after enables pagination by accepting a cursor
       * - first: 10 limits results to 10 journals per page
       */
      const query = graphql(`
        query GetJournals($type: String!, $after: String) {
          objects(filter: { type: $type }, first: 10, after: $after) {
            pageInfo {
              hasNextPage
              startCursor
              endCursor
            }
            nodes {
              address
              asMoveObject {
                contents {
                  json
                }
              }
            }
          }
        }
      `);

      const result = await client.query({
        query,
        variables: {
          type: `${journalPackageId}::journal::Journal`,
          after: cursor,
        },
      });

      if (result.data?.objects) {
        const nodes = result.data.objects.nodes as JournalNode[];
        setJournals((prev) => (cursor ? [...prev, ...nodes] : nodes));
        setHasNextPage(result.data.objects.pageInfo.hasNextPage);
        setEndCursor(result.data.objects.pageInfo.endCursor);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load journals");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [graphqlUrl, journalPackageId]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchJournals(endCursor);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" p="6">
        <ClipLoader size={40} />
      </Flex>
    );
  }

  if (error) {
    return <Text color="red">Error loading gallery: {error}</Text>;
  }

  return (
    <Box>
      <Heading size="5" mb="4">
        All Journals
      </Heading>

      {journals.length === 0 ? (
        <Card>
          <Text color="gray">No journals found on the network.</Text>
        </Card>
      ) : (
        <>
          <Flex direction="column" gap="3">
            {journals.map((journal) => {
              const title = journal.asMoveObject?.contents?.json?.title || "Untitled Journal";
              const owner = journal.asMoveObject?.contents?.json?.owner || "Unknown";

              return (
                <Card
                  key={journal.address}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectJournal(journal.address)}
                >
                  <Heading size="3">{title}</Heading>
                  <Text size="1" color="gray" mt="1">
                    Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
                  </Text>
                  <Text size="1" color="gray">
                    ID: {journal.address}
                  </Text>
                </Card>
              );
            })}
          </Flex>

          {hasNextPage && (
            <Flex justify="center" mt="4">
              <Button onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <ClipLoader size={20} /> : "Load More"}
              </Button>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}
```

### Update App Component

Update [src/App.tsx](src/App.tsx) to import and render JournalGallery:

```tsx
import { JournalGallery } from "./JournalGallery";

// Inside the Flex where JournalList is rendered:
<Flex direction="column" gap="6">
  <CreateJournal
    onCreated={(id) => {
      window.location.hash = id;
      setJournal(id);
    }}
  />
  <JournalList
    onSelectJournal={(id) => {
      window.location.hash = id;
      setJournal(id);
    }}
  />
  <JournalGallery
    onSelectJournal={(id) => {
      window.location.hash = id;
      setJournal(id);
    }}
  />
</Flex>
```

### Test

```bash
pnpm dev
```

View all journals on the network. Test pagination by creating many journals or viewing existing ones.

**Key concepts:** GraphQL queries, pagination, querying all objects by type.

---

## Production Build

To build for production:

```bash
pnpm build
```

---

## Resources

- [Sui Documentation](https://docs.sui.io)
- [dApp Kit Documentation](https://sdk.mystenlabs.com/dapp-kit)
- [Move Language Reference](https://docs.sui.io/concepts/sui-move-concepts)
- [Discord Community](https://discord.gg/K79FVNcw55) - Get help and connect with other developers
